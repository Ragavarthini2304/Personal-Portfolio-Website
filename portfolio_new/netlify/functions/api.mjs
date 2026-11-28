import { neon } from "@neondatabase/serverless";
import { timingSafeEqual } from "node:crypto";

// ---------- helpers ----------
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

let client;
const db = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured (Netlify > Site configuration > Environment variables).");
  }
  return (client ??= neon(process.env.DATABASE_URL));
};

// constant-time comparison; refuses to authenticate if ADMIN_KEY is unset
const isAdmin = (req) => {
  const key = process.env.ADMIN_KEY || "";
  if (!key) return false;
  const supplied = Buffer.from(req.headers.get("x-admin-key") || "");
  const expected = Buffer.from(key);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
};

const readBody = async (req) => {
  try {
    const data = await req.json();
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
};

const text = (value, max) => String(value ?? "").trim().slice(0, max);

// admin.html appends " UTC", so send a clean UTC timestamp string
const formatUtc = (value) => new Date(value).toISOString().slice(0, 16).replace("T", " ");

// ---------- handler ----------
export default async (req) => {
  const { pathname } = new URL(req.url);
  const path = pathname.replace(/\/+$/, "") || "/";
  const method = req.method;

  try {
    if (path === "/api/health") {
      return method === "GET" ? json({ status: "ok" }) : json({ error: "Method not allowed" }, 405);
    }

    // ----- /api/projects -----
    if (path === "/api/projects") {
      const sql = db();
      if (method === "GET") {
        const rows = await sql`SELECT id, title, description, tech, link FROM projects ORDER BY id ASC`;
        return json(rows.map((r) => ({ ...r, id: Number(r.id) })));
      }
      if (method === "POST") {
        if (!isAdmin(req)) return json({ error: "Unauthorized" }, 401);
        const body = await readBody(req);
        const title = text(body.title, 200);
        const description = text(body.description, 5000);
        const tech = text(body.tech, 1000);
        const link = text(body.link, 2000);
        if (!title || !description || !tech) {
          return json({ error: "title, description and tech are required" }, 400);
        }
        const rows = await sql`
          INSERT INTO projects (title, description, tech, link)
          VALUES (${title}, ${description}, ${tech}, ${link})
          RETURNING id`;
        return json({ id: Number(rows[0].id) }, 201);
      }
      return json({ error: "Method not allowed" }, 405);
    }

    // ----- /api/contact -----
    if (path === "/api/contact") {
      if (method !== "POST") return json({ error: "Method not allowed" }, 405);
      const body = await readBody(req);
      const name = text(body.name, 200);
      const email = text(body.email, 320);
      const message = text(body.message, 5000);
      if (!(name && email.includes("@") && message)) {
        return json({ error: "Please fill all fields with a valid email." }, 400);
      }
      const sql = db();
      await sql`INSERT INTO messages (name, email, message) VALUES (${name}, ${email}, ${message})`;
      return json({ ok: true }, 201);
    }

    // ----- /api/messages -----
    if (path === "/api/messages") {
      if (method !== "GET") return json({ error: "Method not allowed" }, 405);
      if (!isAdmin(req)) return json({ error: "Wrong admin key" }, 401);
      const sql = db();
      const rows = await sql`SELECT id, name, email, message, created_at FROM messages ORDER BY id DESC`;
      return json(rows.map((r) => ({ ...r, id: Number(r.id), created_at: formatUtc(r.created_at) })));
    }

    // ----- /api/messages/:id -----
    const match = path.match(/^\/api\/messages\/(\d+)$/);
    if (match) {
      if (method !== "DELETE") return json({ error: "Method not allowed" }, 405);
      if (!isAdmin(req)) return json({ error: "Wrong admin key" }, 401);
      const sql = db();
      await sql`DELETE FROM messages WHERE id = ${Number(match[1])}`;
      return json({ ok: true });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    // Return JSON (not an HTML error page) so the frontend can fall back gracefully.
    console.error("API error:", err);
    return json({ error: "Server error. Please try again shortly." }, 503);
  }
};

// Route every /api/* request to this one function.
export const config = { path: "/api/*" };

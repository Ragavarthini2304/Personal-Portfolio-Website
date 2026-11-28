# Personal Portfolio — Netlify + Neon PostgreSQL

Static frontend (`static/`) + one serverless API function (`netlify/functions/api.mjs`)
+ Neon PostgreSQL. Netlify cannot run Flask, so the API is written in JavaScript;
the frontend and database schema are unchanged.

## Project layout
```
static/                    index.html, admin.html, style.css, script.js
netlify/functions/api.mjs  API: /api/projects, /api/contact, /api/messages, /api/health
netlify.toml               Netlify config (publish dir, functions dir, /admin route)
package.json               Dependency: @neondatabase/serverless
schema.sql                 Creates tables + seeds the 3 projects (run once in Neon)
.env.example               Template for local environment variables
```

## 1. Database (Neon)
1. Neon console → **SQL Editor** → run all of `schema.sql` once (skip if already done).
2. **Security:** if real credentials were ever committed (e.g. in an old `.env.example`),
   reset the DB password in Neon (Roles → Reset password) and choose a new `ADMIN_KEY`.

## 2. Run locally (optional)
```bash
npm install
npm install -g netlify-cli
cp .env.example .env        # fill in real values
netlify dev                 # http://localhost:8888
```

## 3. Push to GitHub
Commit everything except `.env` (already in `.gitignore`).

## 4. Deploy on Netlify
1. Netlify → **Add new site → Import an existing project** → pick your GitHub repo.
2. Build settings are read from `netlify.toml`. Leave **Build command** empty;
   publish directory is `static`.
3. Before (or right after) the first deploy: **Site configuration → Environment variables** → add
   - `DATABASE_URL` = your Neon connection string
   - `ADMIN_KEY` = a long random string
4. If you added the variables after the first deploy: **Deploys → Trigger deploy → Deploy site**
   (variables only apply to new deploys).
5. Test:
   - `https://YOUR-SITE.netlify.app/api/health` → `{"status":"ok"}`
   - `https://YOUR-SITE.netlify.app/api/projects` → JSON list of projects
   - Submit the contact form, then open `/admin`, enter your key and view the message.

> Use Git or `netlify deploy --prod` (CLI). Drag-and-drop deploys do not install
> function dependencies, so the API would fail.

## Troubleshooting
| Symptom | Likely cause |
|---|---|
| `/api/projects` returns 503 | `DATABASE_URL` missing/wrong, or `schema.sql` not run. Check **Logs → Functions → api** |
| Projects show but contact form fails | Same as above (tables missing) or env var not applied: redeploy |
| `/api/...` returns the HTML homepage or 404 | `netlify.toml` not at repo root, or function file not in `netlify/functions/` |
| Build error: cannot find `@neondatabase/serverless` | `package.json` not at repo root |
| "Wrong admin key" | `ADMIN_KEY` in Netlify differs from what you typed (redeploy after changing it) |
| Connection error mentioning `channel_binding` | Remove `&channel_binding=require` from `DATABASE_URL` |

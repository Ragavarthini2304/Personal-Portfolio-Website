const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------- Theme ---------- */
const root = document.documentElement, themeBtn = $("#theme");
const setTheme = t => { root.dataset.theme = t; themeBtn.textContent = t === "dark" ? "🌙" : "☀️"; try { localStorage.setItem("theme", t); } catch {} };
setTheme((() => { try { return localStorage.getItem("theme"); } catch {} })() || "dark");
themeBtn.onclick = () => setTheme(root.dataset.theme === "dark" ? "light" : "dark");
$("#burger").onclick = () => $("#menu").classList.toggle("open");
$$("#menu a").forEach(a => a.onclick = () => $("#menu").classList.remove("open"));

/* ---------- Typing effect ---------- */
const words = ["Computer Science Student", " passionate about creating impactful web experiences.", "Aspiring Full-Stack Developer", "things people enjoy using."];
let w = 0, c = 0, del = false;
(function type() {
  const el = $("#typed"), word = words[w];
  el.textContent = word.slice(0, c);
  if (!del && c === word.length) { del = true; return setTimeout(type, 1400); }
  if (del && c === 0) { del = false; w = (w + 1) % words.length; }
  c += del ? -1 : 1;
  setTimeout(type, del ? 35 : 75);
})();

/* ---------- Scroll: progress, glow, active link ---------- */
addEventListener("scroll", () => {
  const h = document.documentElement;
  $("#progress").style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + "%";
}, { passive: true });
addEventListener("pointermove", e => { const g = $("#glow"); g.style.left = e.clientX + "px"; g.style.top = e.clientY + "px"; });

const secObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) $$("#menu a").forEach(a => a.classList.toggle("active", a.hash === "#" + e.target.id));
}), { rootMargin: "-45% 0px -50% 0px" });
$$("main section").forEach(s => secObs.observe(s));

/* ---------- Reveal, counters, skill bars ---------- */
const skills = {
  "Frontend": [["HTML / CSS", 92], ["JavaScript", 85], ["React.js", 70]],
  "Backend": [["Python / Flask", 82], ["Node / Express", 72], ["REST APIs", 88]],
  "Data & Tools": [["SQL / PostgreSQL", 78], ["MongoDB", 68], ["Git / GitHub", 85]]
};
$("#skillGrid").innerHTML = Object.entries(skills).map(([k, list]) => `
  <div class="skill-box"><h3>${k}</h3>${list.map(([n, v]) =>
  `<div class="bar"><div><span>${n}</span><span>${v}%</span></div><div class="track"><div class="fill" data-w="${v}"></div></div></div>`).join("")}</div>`).join("");

function count(el) {
  const to = +el.dataset.count, t0 = performance.now();
  (function f(t) { const p = Math.min((t - t0) / 1600, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
}
const revObs = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add("in");
  e.target.querySelectorAll(".fill").forEach(f => f.style.width = f.dataset.w + "%");
  revObs.unobserve(e.target);
}), { threshold: .15 });
$$(".reveal").forEach(r => revObs.observe(r));
const cntObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { count(e.target); cntObs.unobserve(e.target); } }));
$$("[data-count]").forEach(n => cntObs.observe(n));

/* ---------- Projects (API with offline fallback) ---------- */
const FALLBACK = [
  { title: "SmartScore AI", description: "Student Performance Prediction and Personalized Study Assistant. Predicts student outcomes and supports personalized study planning.", tech: "Python, Machine Learning, Streamlit", link: "https://github.com/Ragavarthini2304/Student-Performance-Prediction" },
  { title: "Project Management System", description: "A web-based system for managing employees, projects and tasks, including task assignments, deadlines and status tracking.", tech: "HTML, CSS, JavaScript, PHP, MySQL", link: "https://github.com/Ragavarthini2304/Project-Management-System" },
  { title: "Personal Portfolio Website", description: "A responsive personal portfolio showcasing profile information, technical skills and projects.", tech: "HTML, CSS, JavaScript, Flask, PostgreSQL", link: "https://github.com/Ragavarthini2304/Personal-Portfolio-Website" }
];
let projects = [], tag = "All";

function render() {
  const q = $("#search").value.toLowerCase();
  const list = projects.filter(p => (tag === "All" || p.tech.split(",").map(t => t.trim()).includes(tag)) &&
    (p.title + p.description + p.tech).toLowerCase().includes(q));
  $("#grid").innerHTML = list.map(p => `
    <article class="card"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>
    <div class="tags">${p.tech.split(",").map(t => `<span>${esc(t.trim())}</span>`).join("")}</div>
    ${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">View code →</a>` : ""}</article>`).join("");
  $("#empty").hidden = list.length > 0;
  $$(".card").forEach(card => {
    card.onpointermove = e => {
      const r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty("--mx", x + "px"); card.style.setProperty("--my", y + "px");
      card.style.transform = `perspective(700px) rotateX(${(y / r.height - .5) * -8}deg) rotateY(${(x / r.width - .5) * 8}deg) translateY(-4px)`;
    };
    card.onpointerleave = () => card.style.transform = "";
  });
}
function filters() {
  const tags = ["All", ...new Set(projects.flatMap(p => p.tech.split(",").map(t => t.trim())))];
  $("#filters").innerHTML = tags.map(t => `<button class="chip ${t === tag ? "on" : ""}">${esc(t)}</button>`).join("");
  $$(".chip").forEach(b => b.onclick = () => { tag = b.textContent; filters(); render(); });
}
fetch("/api/projects")
  .then(r => { if (!r.ok) throw new Error("Projects API unavailable"); return r.json(); })
  .then(data => { projects = Array.isArray(data) ? data : FALLBACK; })
  .catch(() => { projects = FALLBACK; })
  .finally(() => { filters(); render(); });
$("#search").oninput = render;

/* ---------- Contact form ---------- */
function toast(msg, err) { const t = $("#toast"); t.textContent = msg; t.className = "toast show" + (err ? " err" : ""); setTimeout(() => t.className = "toast", 3200); }
$("#form").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, data = Object.fromEntries(new FormData(f)), btn = f.querySelector("button");
  let ok = true;
  f.querySelectorAll("input,textarea").forEach(i => { const bad = !i.value.trim() || (i.type === "email" && !/^\S+@\S+\.\S+$/.test(i.value)); i.classList.toggle("bad", bad); if (bad) ok = false; });
  if (!ok) return toast("Please fill all fields correctly.", true);
  btn.disabled = true; btn.firstChild.textContent = "Sending…";
  try {
    const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error((await r.json()).error);
    toast("Message sent! I'll get back to you soon 🚀"); f.reset();
  } catch (err) { toast(err.message || "Could not send. Try again.", true); }
  btn.disabled = false; btn.firstChild.textContent = "Send message";
});

/* ---------- Particle network background ---------- */
const cv = $("#bg"), ctx = cv.getContext("2d");
let pts = [], mouse = { x: -999, y: -999 };
function size() { cv.width = innerWidth; cv.height = innerHeight; pts = Array.from({ length: Math.min(80, innerWidth / 14 | 0) }, () => ({ x: Math.random() * cv.width, y: Math.random() * cv.height, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4 })); }
addEventListener("resize", size); size();
addEventListener("pointermove", e => mouse = { x: e.clientX, y: e.clientY });
(function draw() {
  ctx.clearRect(0, 0, cv.width, cv.height);
  const dark = root.dataset.theme === "dark", col = dark ? "139,149,176" : "91,100,120";
  pts.forEach((p, i) => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > cv.width) p.vx *= -1; if (p.y < 0 || p.y > cv.height) p.vy *= -1;
    ctx.fillStyle = `rgba(${col},.6)`; ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 7); ctx.fill();
    for (let j = i + 1; j < pts.length; j++) {
      const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < 120) { ctx.strokeStyle = `rgba(${col},${.18 * (1 - d / 120)})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
    }
    const m = Math.hypot(p.x - mouse.x, p.y - mouse.y);
    if (m < 150) { ctx.strokeStyle = `rgba(56,189,248,${.4 * (1 - m / 150)})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
  });
  requestAnimationFrame(draw);
})();

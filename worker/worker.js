// Software Hub API: a small Cloudflare Worker.
// It (1) caches your release list so the site never hits GitHub's request limit,
// (2) collects "notify me" email sign-ups, problem reports, and reviews, and
// (3) optionally emails subscribers when you publish a new stable release.
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const repos = (env) => (env.REPOS || "").split(",").map((s) => s.trim()).filter(Boolean);
const clip = (v, n) => String(v || "").slice(0, n);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const when = (t) => { const d = new Date(Number(t)); return isNaN(d) ? "Unknown date" : d.toISOString().replace("T", " ").slice(0, 16) + " UTC"; };
const html = (body) => new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" } });

async function entries(env, prefix) {
  const list = await env.HUB.list({ prefix, limit: 1000 });
  return Promise.all(list.keys.map(async (k) => {
    let v = {};
    try { v = JSON.parse((await env.HUB.get(k.name)) || "{}"); } catch {}
    return { key: k.name, ...(v && typeof v === "object" ? v : {}) };
  }));
}

async function adminPage(env, token) {
  const [fb, subs, revs] = await Promise.all([entries(env, "fb:"), entries(env, "sub:"), entries(env, "rev:")]);
  const fbRows = fb.sort((a, b) => (Number(String(b.key).split(":")[1]) || 0) - (Number(String(a.key).split(":")[1]) || 0)).map((r) => {
    const meta = [r.app || "Unknown app", r.version ? "v" + r.version : "", r.os || ""].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join("");
    const email = r.email ? `<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>` : "No email provided";
    return `<article class="item"><div class="meta">${meta}<span class="date">${when(String(r.key).split(":")[1])}</span></div><p class="msg">${esc(r.message || "").replace(/\n/g, "<br>")}</p><p class="email">${email}</p></article>`;
  }).join("");
  const subRows = subs.sort((a, b) => (Number(b.t) || 0) - (Number(a.t) || 0)).map((s) => {
    const rest = String(s.key).slice(4), i = rest.indexOf(":"), repo = i > -1 ? rest.slice(0, i) : rest, email = i > -1 ? rest.slice(i + 1) : "";
    return `<tr><td>${esc(s.app || "")}</td><td><code>${esc(repo)}</code></td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td><td>${when(s.t)}</td></tr>`;
  }).join("");
  const revRows = revs.sort((a, b) => (Number(String(b.key).split(":")[2]) || 0) - (Number(String(a.key).split(":")[2]) || 0)).map((r) => {
    const parts = String(r.key).split(":"), repo = parts[1] || "", t = Number(parts[2]) || 0;
    const stars = Array.from({ length: 5 }, (_, i) => `<span style="color:${i < (r.rating||0) ? '#ffd43b' : '#ccc'}">&#9733;</span>`).join("");
    const email = r.email ? `<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>` : "Anonymous";
    return `<article class="item"><div class="meta"><span>${esc(r.app || "")}</span><code>${esc(repo)}</code><span style="font-size:1.1rem">${stars}</span><span class="date">${when(t)}</span></div><p class="msg">${esc(r.message || "").replace(/\n/g, "<br>")}</p><p class="email">${email}</p></article>`;
  }).join("");
  const q = encodeURIComponent(token);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="no-referrer">
<title>Software Hub admin</title>
<style>
:root{color-scheme:light dark;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.5}
*{box-sizing:border-box}
body{margin:0;background:#f4f7f6;color:#17211f}
main{max-width:1000px;margin:0 auto;padding:2rem 1.2rem 4rem}
header{border-bottom:2px solid #d8e3e0;padding-bottom:1rem;margin-bottom:2rem}
h1{margin:0;font-size:1.8rem;letter-spacing:-.02em}
h2{font-size:1.15rem;margin:0 0 1rem}
p{margin:.3rem 0}
.sub{opacity:.7;font-size:.95rem}
.count{display:inline-block;margin-left:.4rem;padding:.05rem .55rem;border-radius:999px;background:#d8e3e0;font-size:.8rem;vertical-align:middle}
section{margin-top:2.2rem}
.item{background:#fff;border:1px solid #d8e3e0;border-radius:14px;padding:1rem 1.1rem;margin-bottom:.8rem}
.meta{display:flex;flex-wrap:wrap;gap:.4rem .8rem;font-size:.85rem;color:#4b5d5b;margin-bottom:.5rem}
.meta span{background:#eef4f2;border-radius:999px;padding:.1rem .6rem}
.meta .date{margin-left:auto;background:none;padding:0}
.msg{margin:.2rem 0 .6rem;overflow-wrap:anywhere}
.email{font-size:.88rem;color:#4b5d5b}
.empty{opacity:.65;font-style:italic}
.tablewrap{overflow-x:auto;background:#fff;border:1px solid #d8e3e0;border-radius:14px}
table{width:100%;border-collapse:collapse;font-size:.92rem}
th,td{text-align:left;padding:.7rem .9rem;border-bottom:1px solid #edf2f1;vertical-align:top}
th{font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:#4b5d5b;background:#f8faf9}
tr:last-child td{border-bottom:0}
code{font:.85em ui-monospace,Menlo,Consolas,monospace}
footer{margin-top:3rem;padding-top:1rem;border-top:2px solid #d8e3e0;font-size:.85rem;color:#4b5d5b}
a{color:#0b6a70}
@media(prefers-color-scheme:dark){body{background:#0f1514;color:#e4efed}header,footer{border-color:#2a3a37}.item,.tablewrap{background:#16201f;border-color:#2a3a37}.meta span{background:#22302e}.meta .date{background:none}.meta,.email,th,footer{color:#a9c0bb}th{background:#1b2826}th,td{border-color:#2a3a37}.count{background:#2a3a37}a{color:#5fd0bd}}
</style>
</head>
<body>
<main>
<header>
<h1>Software Hub admin</h1>
<p class="sub">Private dashboard. Keep this URL to yourself — anyone with it can read these entries.</p>
</header>
<section>
<h2>Problem reports and ideas<span class="count">${fb.length}</span></h2>
${fbRows || '<p class="empty">No reports yet.</p>'}
</section>
<section>
<h2>Update sign-ups<span class="count">${subs.length}</span></h2>
  ${subRows ? `<div class="tablewrap"><table><thead><tr><th>App</th><th>Repository</th><th>Email</th><th>Signed up</th></tr></thead><tbody>${subRows}</tbody></table></div>` : '<p class="empty">No sign-ups yet.</p>'}
  </section>
  <section>
  <h2>Reviews<span class="count">${revs.length}</span></h2>
  ${revRows || '<p class="empty">No reviews yet.</p>'}
  </section>
  <footer>
  <p>Generated ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC · <a href="/admin?token=${q}">Refresh</a> · <a href="/admin/run?token=${q}">Check for updates now</a> · <a href="/admin/feedback?token=${q}">Reports JSON</a> · <a href="/admin/subscribers?token=${q}">Sign-ups JSON</a> · <a href="/admin/reviews?token=${q}">Reviews JSON</a></p>
  <p>Showing up to 1000 entries per section. Reports and reviews are kept for 180 days.</p>
</footer>
</main>
</body>
</html>`;
}

async function releases(env, repo) {
  const h = { "User-Agent": "software-hub", Accept: "application/vnd.github+json" };
  if (env.GITHUB_TOKEN) h.Authorization = "Bearer " + env.GITHUB_TOKEN;
  const r = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=40`, { headers: h });
  if (!r.ok) throw new Error("github " + r.status);
  return r.json();
}

// The public /releases/latest redirect points at the newest stable release and is not
// subject to the API's per-IP rate limit. The API remains a fallback.
async function latestRelease(env, repo) {
  const page = await fetch(`https://github.com/${repo}/releases/latest`, { headers: { "User-Agent": "software-hub" } });
  if (page.ok) {
    const m = page.url.match(/\/releases\/tag\/([^/?#]+)/);
    if (m) return { tag_name: decodeURIComponent(m[1]) };
  }
  const h = { "User-Agent": "software-hub", Accept: "application/vnd.github+json" };
  if (env.GITHUB_TOKEN) h.Authorization = "Bearer " + env.GITHUB_TOKEN;
  const r = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=40`, { headers: h });
  if (!r.ok) throw new Error("github " + r.status);
  const list = await r.json();
  return list.find((x) => !x.prerelease && !x.draft) || null;
}

async function runUpdates(env) {
  const out = [];
  for (const repo of repos(env)) {
    try {
      const latest = await latestRelease(env, repo);
      if (!latest) { out.push({ repo, status: "no stable release" }); continue; }
      const last = await env.HUB.get("last:" + repo);
      const from = String(env.MAIL_FROM || "");
      const mailReady = Boolean(env.RESEND_API_KEY) && Boolean(from) && !/YOUR-DOMAIN/i.test(from);
      const mailProblem = () => env.RESEND_API_KEY
        ? { status: "email misconfigured", pending: true, detail: "Set MAIL_FROM to a verified sender" }
        : { status: "email not configured", pending: true };
      if (!last) {
        if (!mailReady) { out.push({ repo, version: latest.tag_name, ...mailProblem() }); continue; }
        await env.HUB.put("last:" + repo, latest.tag_name);
        out.push({ repo, status: "baseline recorded", version: latest.tag_name });
        continue;
      }
      if (last === latest.tag_name) { out.push({ repo, status: "already current", version: latest.tag_name }); continue; }
      if (!mailReady) { out.push({ repo, version: latest.tag_name, ...mailProblem() }); continue; }
      const name = repo.split("/")[1], version = latest.tag_name.replace(/^(RT-|CCU-|v)/i, "");
      const subs = await env.HUB.list({ prefix: `sub:${repo}:` });
      let sent = 0, failed = 0, error = "";
      for (const k of subs.keys) {
        const to = k.name.split(":").slice(2).join(":");
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ from, to, subject: `${name} ${version} is available`, text: `A new version of ${name} (${version}) is ready to download.\n\n${env.SITE_URL || ""}\n\nYou are receiving this because you asked to be notified. Reply to this email to stop.` }),
        });
        if (r.ok) sent++;
        else { failed++; if (!error) error = (await r.text()).slice(0, 300); }
      }
      await env.HUB.put("last:" + repo, latest.tag_name);
      out.push({ repo, status: "checked", version: latest.tag_name, sent, failed, ...(error ? { error } : {}) });
    } catch (e) {
      out.push({ repo, status: "error", error: String(e).slice(0, 300) });
    }
  }
  return out;
}

export default {
  async fetch(req, env, ctx) {
    const u = new URL(req.url), p = u.pathname.split("/").filter(Boolean);
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    try {
      // GET /releases/<owner>/<repo>  (cached for 5 minutes)
      if (req.method === "GET" && p[0] === "releases" && p.length === 3) {
        const repo = p[1] + "/" + p[2];
        if (!repos(env).includes(repo)) return json({ error: "unknown repo" }, 404);
        const key = new Request(u.origin + "/cache/" + repo);
        let res = await caches.default.match(key);
        if (!res) {
          res = new Response(JSON.stringify(await releases(env, repo)), { headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" } });
          ctx.waitUntil(caches.default.put(key, res.clone()));
        }
        return res;
      }
      // POST /subscribe  { repo, app, email }
      if (req.method === "POST" && p[0] === "subscribe") {
        const b = await req.json(), email = clip(b.email, 200).toLowerCase(), repo = clip(b.repo, 100);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !repos(env).includes(repo)) return json({ error: "invalid" }, 400);
        await env.HUB.put(`sub:${repo}:${email}`, JSON.stringify({ app: clip(b.app, 80), t: Date.now() }));
        return json({ ok: true });
      }
      // POST /feedback  { app, version, os, message, email }
      if (req.method === "POST" && p[0] === "feedback") {
        const b = await req.json(), message = clip(b.message, 3000).trim();
        if (!message) return json({ error: "empty" }, 400);
        await env.HUB.put(`fb:${Date.now()}:${crypto.randomUUID().slice(0, 6)}`, JSON.stringify({ app: clip(b.app, 80), version: clip(b.version, 40), os: clip(b.os, 20), email: clip(b.email, 200), message }), { expirationTtl: 60 * 60 * 24 * 180 });
        return json({ ok: true });
      }
      // POST /review  { repo, app, rating, message, email }
      if (req.method === "POST" && p[0] === "review") {
        const b = await req.json(), message = clip(b.message, 3000).trim(), repo = clip(b.repo, 100);
        const rating = parseInt(b.rating, 10);
        if (!message || rating < 1 || rating > 5 || !repos(env).includes(repo)) return json({ error: "invalid" }, 400);
        await env.HUB.put(`rev:${repo}:${Date.now()}:${crypto.randomUUID().slice(0, 6)}`, JSON.stringify({ app: clip(b.app, 80), rating, message, email: clip(b.email, 200) }), { expirationTtl: 60 * 60 * 24 * 180 });
        return json({ ok: true });
      }
      // GET /reviews/<owner>/<repo>
      if (req.method === "GET" && p[0] === "reviews" && p.length === 3) {
        const repo = p[1] + "/" + p[2];
        if (!repos(env).includes(repo)) return json({ error: "unknown repo" }, 404);
        const list = await env.HUB.list({ prefix: `rev:${repo}:`, limit: 1000 });
        const reviews = await Promise.all(list.keys.map(async (k) => {
          let v = {};
          try { v = JSON.parse((await env.HUB.get(k.name)) || "{}"); } catch {}
          const t = Number(String(k.name).split(":")[2]) || 0;
          return { ...(v && typeof v === "object" ? v : {}), t };
        }));
        return json(reviews.sort((a, b) => (b.t || 0) - (a.t || 0)));
      }
      // GET /admin?token=...  (private dashboard), /admin/feedback?token=..., /admin/subscribers?token=..., /admin/reviews?token=...
      if (req.method === "GET" && p[0] === "admin") {
        if (!env.ADMIN_TOKEN || u.searchParams.get("token") !== env.ADMIN_TOKEN) return json({ error: "not found" }, 404);
        if (p.length === 1) return html(await adminPage(env, u.searchParams.get("token")));
        if (p.length === 2 && p[1] === "check") return json({ ok: true });
        if (p.length === 2 && p[1] === "run") return json(await runUpdates(env));
        if (p.length === 2 && (p[1] === "feedback" || p[1] === "subscribers" || p[1] === "reviews")) {
          const prefix = p[1] === "feedback" ? "fb:" : p[1] === "reviews" ? "rev:" : "sub:";
          const list = await entries(env, prefix);
          // Sort by timestamp desc
          const sorted = list.sort((a, b) => {
            const ta = Number(String(a.key || "").match(/:(\d+)/)?.[1] || String(a.t) || 0);
            const tb = Number(String(b.key || "").match(/:(\d+)/)?.[1] || String(b.t) || 0);
            return tb - ta;
          });
          return json(sorted);
        }
        return json({ error: "not found" }, 404);
      }
      // POST /admin/delete  { type: "fb"|"sub"|"rev", key: "..." }
      if (req.method === "POST" && p[0] === "admin" && p[1] === "delete") {
        if (!env.ADMIN_TOKEN || u.searchParams.get("token") !== env.ADMIN_TOKEN) return json({ error: "not found" }, 404);
        const b = await req.json();
        if (!b.type || !b.key) return json({ error: "invalid" }, 400);
        await env.HUB.delete(b.key);
        return json({ ok: true });
      }
    } catch (e) {
      return json({ error: "server error" }, 500);
    }
    return json({ error: "not found" }, 404);
  },

  // Runs on a schedule (see wrangler.toml) and manually via /admin/run.
  async scheduled(event, env) {
    await runUpdates(env);
  },
};

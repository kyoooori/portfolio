// Password protection for selected portfolio projects.
// Everything else on the site is served normally.

// ✏️ List the project pages to lock. Each entry also locks everything under it,
// e.g. "/projects/acme" locks /projects/acme, /projects/acme/, /projects/acme.html
// and /projects/acme/hero.png.
const PROTECTED = [
  "/global-search",
  "/inspections",
  "/related-records",
];

// ✏️ Files whose names start with these are locked too (e.g. the case-study images)
const PROTECTED_PREFIXES = [
  "/media/gs-",
  "/media/insp-",
  "/media/rr-",
];

// ✏️ Exceptions that stay public (e.g. thumbnails shown on the homepage)
const ALWAYS_PUBLIC = [
  "/media/gs-thumb.webp",
];

const COOKIE_NAME = "portfolio_unlock";
const COOKIE_DAYS = 30; // how long a visitor stays unlocked

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Password form submission
    if (url.pathname === "/__unlock" && request.method === "POST") {
      return handleUnlock(request, env);
    }

    // Locked page, no valid cookie → show the password page
    if (isProtected(url.pathname)) {
      // No password configured yet → keep locked pages locked
      if (!env.SITE_PASSWORD || !(await hasValidCookie(request, env))) {
        return passwordPage(url.pathname + url.search, false, 401);
      }
      const res = await env.ASSETS.fetch(request);
      const out = new Response(res.body, res);
      out.headers.set("Cache-Control", "private, no-store");
      out.headers.set("X-Robots-Tag", "noindex");
      return out;
    }

    // Everything else: serve the site as usual
    return env.ASSETS.fetch(request);
  },
};

function isProtected(pathname) {
  let path;
  try {
    path = decodeURIComponent(pathname).toLowerCase();
  } catch {
    return true; // malformed URL → be safe
  }
  if (ALWAYS_PUBLIC.some((p) => path === p.toLowerCase())) return false;
  if (PROTECTED_PREFIXES.some((pre) => path.startsWith(pre.toLowerCase()))) return true;
  return PROTECTED.some((entry) => {
    const p = entry.toLowerCase().replace(/\/+$/, "");
    return path === p || path.startsWith(p + "/") || path.startsWith(p + ".");
  });
}

async function handleUnlock(request, env) {
  if (!env.SITE_PASSWORD) return passwordPage("/", true, 401);
  const form = await request.formData();
  const password = String(form.get("password") || "");
  const next = safeNext(String(form.get("next") || "/"));

  if (!timingSafeEqual(password, env.SITE_PASSWORD)) {
    return passwordPage(next, true, 401);
  }

  const token = await makeToken(env.SITE_PASSWORD);
  return new Response(null, {
    status: 303,
    headers: {
      Location: next,
      "Set-Cookie": `${COOKIE_NAME}=${token}; Path=/; Max-Age=${COOKIE_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

async function hasValidCookie(request, env) {
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([a-f0-9]+)`));
  if (!match) return false;
  return timingSafeEqual(match[1], await makeToken(env.SITE_PASSWORD));
}

// The cookie value is derived from the password, so changing the password
// signs everyone out automatically.
async function makeToken(secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("portfolio-unlocked-v1"));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Only allow redirects back to a page on this site
function safeNext(next) {
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function passwordPage(next, wrong, status) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Protected project · Keyuri Tatu</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    background: light-dark(#fafaf9, #111); color: light-dark(#1c1917, #f5f5f4);
  }
  main { width: 100%; max-width: 360px; }
  h1 { font-size: 22px; font-weight: 600; margin: 0 0 8px; letter-spacing: -0.01em; }
  p { margin: 0 0 24px; color: light-dark(#57534e, #a8a29e); line-height: 1.5; font-size: 15px; }
  input {
    width: 100%; padding: 12px 14px; font: inherit; font-size: 15px; border-radius: 10px;
    border: 1px solid ${wrong ? "#dc2626" : "light-dark(#d6d3d1, #44403c)"};
    background: light-dark(#fff, #1c1917); color: inherit; outline: none;
  }
  input:focus { border-color: light-dark(#1c1917, #f5f5f4); }
  .error { color: #dc2626; font-size: 13px; margin: 8px 0 0; }
  button {
    width: 100%; margin-top: 16px; padding: 12px; font: inherit; font-size: 15px; font-weight: 500;
    border: 0; border-radius: 10px; cursor: pointer;
    background: light-dark(#1c1917, #f5f5f4); color: light-dark(#fff, #111);
  }
  a { display: inline-block; margin-top: 24px; font-size: 14px; color: inherit; opacity: .7; }
</style>
</head>
<body>
<main>
  <h1>This project is password protected</h1>
  <p>It includes work under NDA. Enter the password from my resume or application to view it.</p>
  <form method="POST" action="/__unlock">
    <input type="hidden" name="next" value="${escapeHtml(next)}">
    <input type="password" name="password" placeholder="Password" autocomplete="current-password" autofocus required aria-label="Password">
    ${wrong ? '<p class="error" role="alert">That password didn’t work. Try again.</p>' : ""}
    <button type="submit">View project</button>
  </form>
  <a href="/">← Back to portfolio</a>
</main>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

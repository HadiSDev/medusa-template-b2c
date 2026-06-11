import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * Medusa-host SSO bridge.
 *
 * The control plane (apps/api in medusa-hoster) mints a Medusa admin JWT
 * server-side via `/auth/user/emailpass`, then opens the user's browser at
 *   https://<slug>.<domain>/sso#token=<jwt>
 * — the fragment is browser-only, so the JWT never hits any server log.
 *
 * This route serves a tiny HTML page that:
 *   1. Reads the JWT from the URL fragment.
 *   2. POSTs it to /auth/session as a Bearer token — the Medusa core
 *      handler stores the auth context in req.session, and express-session
 *      issues a `connect.sid` cookie that the admin SPA relies on (the SPA
 *      is initialized with auth.type="session", so it never reads the JWT
 *      itself — it just sends the session cookie on every request).
 *   3. Replaces history with `/app` (so the back button doesn't bounce
 *      the user back to /sso#token=...).
 *
 * No server-side state, no auth — the route is intentionally public.
 * The JWT is the credential; it expires 24h after issue.
 */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Signing in…</title>
  <meta name="robots" content="noindex" />
  <style>
    body { font: 14px/1.5 system-ui, sans-serif; margin: 0; padding: 48px; color: #444; }
    .box { max-width: 360px; margin: 0 auto; text-align: center; }
  </style>
</head>
<body>
  <div class="box">Signing you in…</div>
  <script>
    (function () {
      var hash = (window.location.hash || "").replace(/^#/, "");
      var params = new URLSearchParams(hash);
      var token = params.get("token");
      function done() { window.location.replace("/app"); }
      if (!token) return done();
      // Medusa admin SPA runs with auth.type="session" — the JWT is exchanged
      // for a server-set session cookie via POST /auth/session.
      fetch("/auth/session", {
        method: "POST",
        credentials: "include",
        headers: { Authorization: "Bearer " + token },
      }).then(done, done);
    })();
  </script>
</body>
</html>`);
}

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
 *   2. Writes it into the `medusa_auth` cookie the admin SPA reads on load.
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
      if (token) {
        try { window.localStorage.setItem("medusa_auth_token", token); } catch (_) {}
      }
      window.location.replace("/app");
    })();
  </script>
</body>
</html>`);
}

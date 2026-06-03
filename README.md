# medusa-template-b2c

B2C [Medusa v2](https://docs.medusajs.com/) backend, packaged as a deployable
container image for the
[medusa-hoster](https://github.com/HadiSDev/medusa-hoster) control plane.

This is the v1 baseline — vanilla Medusa v2 defaults, no extra modules. Future
templates (`b2b`, `marketplace`, `services`) will live in their own repos and
diverge on enabled modules / custom code; see medusa-hoster's
[ADR 004](https://github.com/HadiSDev/medusa-hoster/blob/main/docs/decisions/004-tenant-image-strategy.md).

## Origin & deprecation note

The source layout is forked from `medusajs/medusa-starter-default` at
`@medusajs/medusa@2.15.3`. That upstream repo is now deprecated in favor of the
`medusajs/dtc-starter` *monorepo* (which bundles a Next.js storefront). For a
single-backend template image like this one, the simple structure of
`medusa-starter-default` is the right shape — when a current, focused successor
appears, we'll migrate. The `Dockerfile`, `entrypoint.sh`, and `.dockerignore`
are the additions on top of the starter; everything else is unchanged.

## Build the image locally

```bash
docker build -t medusahost/b2c:dev .
```

The build is multi-stage: it installs deps with the project's bundled Yarn 4,
runs `medusa build` to produce the standalone `.medusa/server` layout, then
copies that into a slim runtime stage and installs only its runtime deps.

## Runtime environment

The container expects these to be set at run time (by the control plane):

| Variable                | Purpose                                              |
|-------------------------|------------------------------------------------------|
| `DATABASE_URL`          | Postgres URL for this tenant's dedicated DB          |
| `STORE_CORS`            | Allowed origins for the store API                    |
| `ADMIN_CORS`            | Allowed origins for the admin API                    |
| `AUTH_CORS`             | Allowed origins for the auth endpoints (v2 only)     |
| `JWT_SECRET`            | Per-tenant JWT secret                                |
| `COOKIE_SECRET`         | Per-tenant cookie secret                             |
| `MEDUSA_ADMIN_EMAIL`    | Email of the admin user seeded on first boot         |
| `MEDUSA_ADMIN_PASSWORD` | Password of that admin user (idempotent)             |

`REDIS_URL` is **not** required: this baseline uses Medusa's in-memory
event-bus / workflow-engine / cache. Wire the redis modules
(`@medusajs/event-bus-redis` etc.) in `medusa-config.ts` before scaling to
multiple workers — that's a follow-up, not a v1 blocker.

## Entrypoint

On every container start, `entrypoint.sh` runs:

1. `medusa db:migrate` — idempotent.
2. `medusa user --email $MEDUSA_ADMIN_EMAIL --password $MEDUSA_ADMIN_PASSWORD` —
   creates the admin user on first boot; re-runs are tolerated (the CLI errors
   if the user exists, which the script swallows).
3. `exec medusa start` — replaces the shell so `SIGTERM` reaches Medusa for a
   clean shutdown.

Both `medusa-config.ts` (env-driven by the upstream starter) and the entrypoint
were chosen to make the control plane's job trivial: produce the right env,
pull this image, run it.

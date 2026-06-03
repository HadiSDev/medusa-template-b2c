#!/bin/sh
# Idempotent boot for a Medusa v2 tenant container:
#   1. run pending migrations
#   2. ensure an admin user exists (only if creds were injected)
#   3. exec medusa start
# Re-running this entrypoint on an existing tenant DB is safe.

set -e

MEDUSA=./node_modules/.bin/medusa

echo "→ medusa db:migrate"
"$MEDUSA" db:migrate

if [ -n "$MEDUSA_ADMIN_EMAIL" ] && [ -n "$MEDUSA_ADMIN_PASSWORD" ]; then
  echo "→ ensuring admin user ($MEDUSA_ADMIN_EMAIL)"
  # `medusa user` exits non-zero if the user already exists — treat that as success
  # so the entrypoint is safe to re-run.
  "$MEDUSA" user --email "$MEDUSA_ADMIN_EMAIL" --password "$MEDUSA_ADMIN_PASSWORD" || true
fi

echo "→ medusa start"
exec "$MEDUSA" start

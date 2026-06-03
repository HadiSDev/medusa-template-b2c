# syntax=docker/dockerfile:1.7
#
# B2C Medusa template image for medusa-hoster.
# Built per ADR 004 of medusa-hoster: this image is the deployable artifact;
# the control plane only pulls and runs it (never builds).
#
# Stages:
#   1. builder  — install deps with the project's bundled Yarn 4 and run
#                 `medusa build`, which produces a standalone production
#                 layout at .medusa/server.
#   2. runtime  — copy that layout, install only its runtime dependencies,
#                 then exec the entrypoint (migrate → seed admin → start).

# ───────────────── builder ─────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Native build deps for any packages that need a compile step (swc, pg, etc.)
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install with the project's bundled Yarn 4 to honor yarn.lock exactly.
COPY .yarnrc.yml package.json yarn.lock ./
COPY .yarn ./.yarn
RUN node .yarn/releases/yarn-4.12.0.cjs install --immutable

COPY . .
RUN node .yarn/releases/yarn-4.12.0.cjs build

# ───────────────── runtime ─────────────────
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# .medusa/server is a self-contained production layout with its own package.json
COPY --from=builder /app/.medusa/server ./
RUN npm install --omit=dev --no-audit --no-fund

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["./entrypoint.sh"]

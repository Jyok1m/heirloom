# syntax=docker/dockerfile:1

# Multi-arch (linux/amd64 + linux/arm64): all base images are multi-platform
# and there is no arch-specific code. Prisma 7 uses the pg driver adapter at
# runtime (pure JS, no native query engine), so the image is portable as-is.
# Build context is the monorepo ROOT (docker build -f apps/heirloom-api/Dockerfile .)

# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

# ---------------------------------------------------------------------------
# Install all deps (incl. dev) for the API workspace
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/heirloom-api/package.json apps/heirloom-api/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter heirloom-api...

# ---------------------------------------------------------------------------
# Generate the Prisma client, then compile
FROM deps AS build
COPY apps/heirloom-api apps/heirloom-api
RUN pnpm --filter heirloom-api exec prisma generate \
 && pnpm --filter heirloom-api build
# Produce a pruned, production-only bundle with a real (non-symlinked) node_modules
# --legacy: required since pnpm 10 for non-injected workspace packages
RUN pnpm --filter heirloom-api --prod --legacy deploy /prod

# ---------------------------------------------------------------------------
# One-shot migration image: `docker run` this (or a compose service) to apply
# pending migrations before starting the API — build target `migrate`.
FROM build AS migrate
WORKDIR /app/apps/heirloom-api
# Invoke the Prisma CLI directly (not via `pnpm exec`): pnpm would re-verify the
# whole workspace and try `install --production` (fails without a TTY, and would
# drop Prisma as a devDependency). Deps are already baked into the image.
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

# ---------------------------------------------------------------------------
# Lean runtime
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /prod
COPY --from=build /prod .
EXPOSE 3000
# Config (DATABASE_URL, AUTH_JWT_SECRET, AI_*, …) is injected via the container env
CMD ["node", "dist/main.js"]

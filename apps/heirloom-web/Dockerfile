# syntax=docker/dockerfile:1

# Multi-arch (linux/amd64 + linux/arm64): node + nginx base images are
# multi-platform and the Astro build output is fully static, so nothing is
# arch-specific. Build context is the monorepo ROOT:
#   docker build -f apps/heirloom-web/Dockerfile .

# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

# ---------------------------------------------------------------------------
FROM base AS deps
# pnpm-workspace.yaml carries allowBuilds (esbuild) needed by the Astro build.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/heirloom-web/package.json apps/heirloom-web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter heirloom-web...

# ---------------------------------------------------------------------------
# Build the static site. All PUBLIC_* vars are inlined by Astro at build time
# (canonical/OG/sitemap, GitHub link, live-demo target), so pass them here:
#   --build-arg PUBLIC_URL=https://heirloom-app.com
FROM deps AS build
COPY apps/heirloom-web apps/heirloom-web
ARG PUBLIC_URL=""
ARG PUBLIC_GITHUB_URL=""
ARG PUBLIC_DEMO_URL=""
ENV PUBLIC_URL=$PUBLIC_URL \
    PUBLIC_GITHUB_URL=$PUBLIC_GITHUB_URL \
    PUBLIC_DEMO_URL=$PUBLIC_DEMO_URL
RUN pnpm --filter heirloom-web build

# ---------------------------------------------------------------------------
# Serve the static output with nginx (no backend dependency).
FROM nginx:1.27-alpine AS runtime
COPY apps/heirloom-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/heirloom-web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

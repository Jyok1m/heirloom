# syntax=docker/dockerfile:1

# Multi-arch (linux/amd64 + linux/arm64): node + nginx base images are
# multi-platform and the build output is static, so nothing is arch-specific.
# Build context is the monorepo ROOT (docker build -f apps/heirloom-app/Dockerfile .)

# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

# ---------------------------------------------------------------------------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/heirloom-app/package.json apps/heirloom-app/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter heirloom-app...

# ---------------------------------------------------------------------------
# Build the static bundle. schema.gql and generated GraphQL types are committed,
# so no codegen or backend is needed at build time.
FROM deps AS build
COPY apps/heirloom-app apps/heirloom-app
# schema.gql is referenced by codegen config; copy it so the workspace resolves
COPY apps/heirloom-api/schema.gql apps/heirloom-api/schema.gql
# Absolute site URL baked into canonical/OG tags, robots.txt and sitemap.xml.
# Pass at build time: --build-arg PUBLIC_URL=https://your.domain
ARG PUBLIC_URL=""
ENV PUBLIC_URL=$PUBLIC_URL
RUN pnpm --filter heirloom-app build

# ---------------------------------------------------------------------------
# Serve with nginx; it also reverse-proxies /api and /graphql to the API service
FROM nginx:1.27-alpine AS runtime
COPY apps/heirloom-app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/heirloom-app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

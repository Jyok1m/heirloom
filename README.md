# Heirloom

Open source, self-hosted family tree application. Your family data stays on your own machine.

## Stack

pnpm monorepo:

- `apps/heirloom-api` — NestJS API (GraphQL code-first, PostgreSQL via Prisma)
- `apps/heirloom-app` — React + Vite frontend (Apollo Client) — the product
- `apps/heirloom-web` — Astro + Starlight marketing site (landing, docs, live demo)
- `packages/` — shared code

The product app and the marketing site are deployed on **separate domains**
(the app on `heirloom.joachimjasmin.com`, the marketing site on `heirloom-app.com`).

## Getting started

Requirements: Node.js >= 22, pnpm, Docker.

```bash
cp .env.example .env        # adjust credentials if needed
pnpm install
docker compose up -d db     # PostgreSQL
pnpm db:migrate             # apply database migrations
pnpm db:generate            # regenerate the Prisma client (migrate dev doesn't always do it)
pnpm dev                    # api :3000, app :5173, web :4321
```

Open http://localhost:5173 (product) — the marketing site runs at http://localhost:4321.

Run a single workspace:

```bash
pnpm dev:api                     # API only (:3000)
pnpm dev:app                     # product frontend only (:5173)
pnpm --filter heirloom-web dev   # marketing site only (:4321)
```

## Scripts

```bash
pnpm dev          # api + app + web in watch mode
pnpm dev:api      # API only
pnpm dev:app      # product frontend only
pnpm build        # build all workspaces
pnpm lint         # lint all workspaces

# Database (Prisma)
pnpm db:migrate   # create/apply migrations in dev (prisma migrate dev)
pnpm db:generate  # regenerate the Prisma client after a schema change
pnpm db:studio    # browse data with Prisma Studio
```

In production, apply migrations with `pnpm --filter heirloom-api db:deploy` (`prisma migrate deploy`: applies pending migrations without creating new ones).

## Deployment & CI/CD

The stack is designed for self-hosting with Docker Compose. CI builds
**`linux/amd64`** images and pushes them to Docker Hub; the deploy host only
pulls and runs them.

**On the deploy host** — copy `docker-compose.prod.yml` to `/opt/heirloom/docker-compose.yml`
and add a `.env` (from `.env.example`, with real secrets). Then:

```bash
docker compose pull
docker compose run --rm migrate     # apply pending migrations
docker compose up -d api app web
```

Services and ports (bind to loopback; put each behind your reverse proxy with TLS):

- `api` — the GraphQL/REST backend (internal only).
- `app` — nginx serving the product SPA on `127.0.0.1:8081`; it proxies `/api`
  and `/graphql` to `api`. Map it to the app domain (`heirloom.joachimjasmin.com`).
- `web` — nginx serving the static marketing site on `127.0.0.1:8082`. Map it to
  the marketing domain (`heirloom-app.com`).

`PUBLIC_URL` (and the marketing site's other `PUBLIC_*` vars) are baked into the
frontends **at build time**, so CI passes them as Docker build-args — the host
`.env` doesn't need them for the prebuilt images.

**Pipeline** (`Jenkinsfile` at the repo root, one job for the whole monorepo):
a push to `main` triggers Jenkins via `.github/workflows/trigger_jenkins.yml`. The
pipeline detects which app changed (`git diff`), builds/pushes only the changed
images (`heirloom-api` / `heirloom-app` / `heirloom-web`, tagged with the commit
SHA + `main`), runs migrations when a new one is added, then restarts the changed
services over SSH. Use **"Build with Parameters" → `FORCE_BUILD`** to (re)build and
deploy all three regardless of change detection. Point the Jenkins job's "Pipeline
script from SCM" at the root `Jenkinsfile`. Required Jenkins credentials:
`dockerhub-credentials`, `host-ssh-key`, `host-ssh-port`.

## License

Copyright (C) 2026 Joachim Jasmin

Heirloom is free software: you can redistribute it and/or modify it under the
terms of the **GNU Affero General Public License, version 3** (AGPL-3.0-only) as
published by the Free Software Foundation. See the [LICENSE](LICENSE) file for
the full text.

This program is distributed in the hope that it will be useful, but **WITHOUT
ANY WARRANTY**; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
details.

Because Heirloom is AGPL-licensed, if you run a modified version as a network
service (self-hosted for others), you must make your modified source available
to its users.

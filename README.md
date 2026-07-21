# Heirloom

Open source, self-hosted family tree application. Your family data stays on your own machine.

## Stack

pnpm monorepo:

- `apps/heirloom-api` — NestJS API (GraphQL, PostgreSQL via Prisma)
- `apps/heirloom-app` — React + Vite frontend (Apollo Client)
- `packages/` — shared code

## Getting started

Requirements: Node.js >= 22, pnpm, Docker.

```bash
cp .env.example .env        # adjust credentials if needed
pnpm install
docker compose up -d db     # PostgreSQL
pnpm db:migrate             # apply database migrations (also generates the Prisma client)
pnpm dev                    # API on :3000, app on :5173
```

Open http://localhost:5173.

## Scripts

```bash
pnpm dev          # api + app in watch mode
pnpm dev:api      # API only
pnpm dev:app      # frontend only
pnpm build        # build all workspaces
pnpm lint         # lint all workspaces

# Database (Prisma)
pnpm db:migrate   # create/apply migrations in dev (prisma migrate dev)
pnpm db:generate  # regenerate the Prisma client after a schema change
pnpm db:studio    # browse data with Prisma Studio
```

In production, apply migrations with `pnpm --filter heirloom-api db:deploy` (`prisma migrate deploy`: applies pending migrations without creating new ones).

## Deployment & CI/CD

The stack is designed for self-hosting with Docker Compose. CI builds multi-arch
images (`linux/amd64` + `linux/arm64`) and pushes them to Docker Hub; the deploy
host only pulls and runs them.

**On the deploy host** — copy `docker-compose.prod.yml` to `/opt/heirloom/docker-compose.yml`
and add a `.env` (from `.env.example`, with real secrets and `PUBLIC_URL` set to
your domain). Then:

```bash
docker compose pull
docker compose run --rm migrate     # apply pending migrations
docker compose up -d api app        # nginx (app) proxies /api and /graphql to api
```

The frontend is served by nginx on `127.0.0.1:8081` — put it behind your reverse
proxy (TLS, domain). `PUBLIC_URL` is baked into the frontend **at build time**
(canonical/OG/sitemap), so CI passes it as a Docker build-arg.

**Pipeline** (`Jenkinsfile` at the repo root, one job for the whole monorepo):
a push to `main` triggers Jenkins via `.github/workflows/trigger_jenkins.yml`. The
pipeline detects which app changed (`git diff`), builds/pushes only that image
(tagged with the commit SHA + `main`), then runs migrations and restarts the
changed services over SSH. Point the Jenkins job's "Pipeline script from SCM" at
the root `Jenkinsfile`. Required Jenkins credentials: `dockerhub-credentials`,
`host-ssh-key`, `host-ssh-port`.

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

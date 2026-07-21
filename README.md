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

## License

TBD

---
title: Local development
description: Run Heirloom from source in a few commands — PostgreSQL in Docker, API and frontend in watch mode.
---

Run the full stack from source, with PostgreSQL in Docker and both apps in watch
mode. Best for trying Heirloom out or contributing.

## Requirements

- **Node.js ≥ 22**
- **pnpm** (the repo is a pnpm workspace — do not use npm or yarn)
- **Docker** with the Compose plugin

## Steps

```bash
# 1. Clone
git clone https://github.com/Jyok1m/heirloom.git
cd heirloom

# 2. Environment — copy the template and adjust if needed
cp .env.example .env

# 3. Install workspace dependencies
pnpm install

# 4. Start PostgreSQL
docker compose up -d db

# 5. Apply database migrations (also generates the Prisma client)
pnpm db:migrate

# 6. Run the API (:3000) and the frontend (:5173) together, in watch mode
pnpm dev
```

Then open **http://localhost:5173**. The Vite dev server proxies `/api` and
`/graphql` to the API on port 3000.

## Handy scripts

```bash
pnpm dev          # api + app in watch mode
pnpm dev:api      # API only  (NestJS, port 3000)
pnpm dev:app      # frontend only (Vite, port 5173)
pnpm build        # build all workspaces
pnpm lint         # lint all workspaces

# Database (Prisma)
pnpm db:migrate   # create/apply migrations in dev (prisma migrate dev)
pnpm db:generate  # regenerate the Prisma client after a schema change
pnpm db:studio    # browse data with Prisma Studio
```

:::tip[Optional AI assistant]
Heirloom can use a local LLM through Ollama. On Linux, start it with the Compose
profile: `docker compose --profile llm up -d`. On macOS, Docker has no GPU
access — run Ollama natively (`brew install ollama`) instead. See
[Configuration](/docs/configuration) for the `AI_*` variables.
:::

## Next step

Ready to run it for real? Head to [Self-hosting with Docker](/docs/self-hosting).

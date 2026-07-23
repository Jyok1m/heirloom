---
title: Configuration
description: Every Heirloom environment variable — database, media, auth, AI assistant and SEO — with sensible defaults.
---

All configuration lives in a single `.env` file at the repository (or deploy
directory) root. Start from the committed `.env.example` and override what you
need. **`.env` is gitignored — never commit real secrets.**

## Core

| Variable | Default | Purpose |
| --- | --- | --- |
| `BACKEND_PORT` | `3000` | Port the API listens on. |
| `BACKEND_URL` | `http://localhost:3000` | Base URL of the API. |
| `FRONTEND_PORT` | `5173` | Port of the Vite dev server. |
| `FRONTEND_URL` | `http://localhost:5173` | Base URL of the frontend. Also used to build public share links (`/view/<token>`). |

## Database (PostgreSQL)

| Variable | Default | Purpose |
| --- | --- | --- |
| `POSTGRES_USER` | `heirloom` | Database user. |
| `POSTGRES_PASSWORD` | `changeme` | Database password — **change this**. |
| `POSTGRES_DB` | `heirloom` | Database name. |
| `DATABASE_URL` | `postgresql://heirloom:changeme@localhost:5432/heirloom` | Prisma connection string. In the production Compose file it is composed from the `POSTGRES_*` values and points at the `db` service. |

## Media uploads

| Variable | Default | Purpose |
| --- | --- | --- |
| `MEDIA_ROOT` | `./data/media` | Directory where uploaded files are stored (a Docker volume in production). |
| `MAX_UPLOAD_MB` | `100` | Maximum upload size, in megabytes. |

## Authentication

| Variable | Default | Purpose |
| --- | --- | --- |
| `AUTH_JWT_SECRET` | _(empty)_ | Secret used to sign session JWTs. **Required.** Generate one with `openssl rand -hex 32`. |

## AI assistant (optional)

The assistant is optional. Leave `AI_API_KEY` empty to disable hosted providers,
or point Heirloom at a local model via Ollama.

| Variable | Default | Purpose |
| --- | --- | --- |
| `AI_PROVIDER` | `openai` | One of `anthropic`, `openai`, `ollama`, `llamacpp`. |
| `AI_MODEL` | `gpt-5-mini` | Model identifier for the chosen provider. |
| `AI_API_KEY` | _(empty)_ | API key for hosted providers. Not needed for local models. |
| `AI_BASE_URL` | _(empty)_ | Override the provider endpoint (e.g. a local Ollama URL). |
| `AI_REASONING_EFFORT` | `low` | Reasoning effort hint, where the provider supports it. |

## SEO

| Variable | Default | Purpose |
| --- | --- | --- |
| `PUBLIC_URL` | falls back to `FRONTEND_URL` | Public site URL used for canonical links, Open Graph and the sitemap. Set it to your domain in production — it is baked into the frontend **at build time**, so CI passes it as a Docker build-arg. |

:::tip
After changing a schema-affecting variable or the Prisma schema, regenerate the
client with `pnpm db:generate`. After a migration change, apply it with
`pnpm db:migrate` (dev) or the `migrate` container (production).
:::

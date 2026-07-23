---
title: Documentation
description: Install and run Heirloom — the open-source, self-hosted family tree — from source or with Docker Compose.
---

Heirloom is an **open source, self-hosted** family tree application. Your family
data — people, unions, events, photos and sources — lives on a machine you
control, not in someone else's cloud. It is licensed under the
[GNU AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html).

## What's in the box

A pnpm monorepo with two deployable apps and shared packages:

- **`apps/heirloom-api`** — NestJS API (GraphQL code-first + Apollo), PostgreSQL via Prisma.
- **`apps/heirloom-app`** — React + Vite frontend (Apollo Client), served by nginx in production.
- **`packages/`** — code shared between the apps.

PostgreSQL runs in Docker (locally and in production). Media uploads are stored
on disk. An optional local AI assistant can run via Ollama.

## Choose your path

| I want to… | Start here |
| --- | --- |
| Run Heirloom locally and hack on it | [Local development](/docs/getting-started) |
| Self-host it for my family on a server | [Self-hosting with Docker](/docs/self-hosting) |
| Understand every environment variable | [Configuration](/docs/configuration) |

## Requirements

- **Docker** (and the Compose plugin) — for PostgreSQL, and for the production stack.
- **Node.js ≥ 22** and **pnpm** — only needed if you run from source.

:::note[Self-hosted first]
Heirloom has **no dependency on any proprietary cloud service** to function. The
target deployment is Docker Compose (app + PostgreSQL) on your own hardware.
:::

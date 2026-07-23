---
title: Self-hosting with Docker
description: Run Heirloom in production with Docker Compose — pull the prebuilt images, apply migrations, and serve it behind your reverse proxy.
---

The production stack runs entirely on **Docker Compose**: PostgreSQL, a one-shot
migration container, the API, and the frontend (served by nginx). Images are
prebuilt and published to Docker Hub for both `linux/amd64` and `linux/arm64`,
so your host only pulls and runs them — no build step on the server.

## 1. Prepare the host

Create a directory and drop in the production Compose file and an environment
file:

```bash
sudo mkdir -p /opt/heirloom && cd /opt/heirloom

# The production compose file from the repository:
curl -O https://raw.githubusercontent.com/Jyok1m/heirloom/main/docker-compose.prod.yml
mv docker-compose.prod.yml docker-compose.yml

# Environment from the template — then fill in real secrets:
curl -O https://raw.githubusercontent.com/Jyok1m/heirloom/main/.env.example
mv .env.example .env
```

Edit `.env` and set, at minimum:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — database credentials.
- `AUTH_JWT_SECRET` — generate one with `openssl rand -hex 32`.
- `PUBLIC_URL` — your public domain, e.g. `https://tree.example.com`. It is baked
  into the frontend at build time (canonical / Open Graph / sitemap).

See [Configuration](/docs/configuration) for every variable.

:::caution[Never commit secrets]
`.env` holds real credentials and must stay out of version control. Only
`.env.example` is committed.
:::

## 2. Start the stack

```bash
docker compose pull                 # fetch the prebuilt images
docker compose run --rm migrate     # apply pending database migrations
docker compose up -d api app        # start the API and the frontend
```

The `migrate` service is a one-shot init container: it runs
`prisma migrate deploy` (applies pending migrations without creating new ones),
then exits `0`. The API waits for it to complete before starting.

## 3. Put it behind a reverse proxy

The frontend's nginx listens on **`127.0.0.1:8081`** and already proxies `/api`
and `/graphql` to the API service. Point your reverse proxy (Traefik, nginx,
Caddy…) at that port and terminate TLS there, mapping your domain to it.

```
your domain ──TLS──▶ reverse proxy ──▶ 127.0.0.1:8081 (Heirloom nginx)
                                             ├── /            → static frontend
                                             ├── /api/*       → API
                                             └── /graphql     → API
```

## Updating

Pull the new images and restart — migrations run again the same way:

```bash
docker compose pull
docker compose run --rm migrate
docker compose up -d api app
```

## Backups

Two things hold your data:

- The **`db_data`** volume — the PostgreSQL database. Back it up with
  `pg_dump`, or snapshot the volume.
- The **`media`** volume — uploaded photos and documents.

Back both up together so a restore is consistent.

:::note[AGPL and network use]
If you run a **modified** version of Heirloom as a network service for others,
the AGPL-3.0 requires you to make your modified source available to its users.
Running the unmodified app for your own family has no such obligation.
:::

# heirloom-web

Marketing site for Heirloom — landing page, documentation and live demo.
Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

This is the public presentation site (`https://heirloom-app.com`), separate from
the product apps (`heirloom-api`, `heirloom-app`). It ships no product code and
no billing logic — the managed-hosting/provisioning layer lives in a private
repository.

## Structure

- `src/pages/index.astro` — landing page (`/`)
- `src/pages/demo.astro` — live demo page (`/demo`)
- `src/content/docs/docs/**` — documentation, served by Starlight under `/docs/*`
- `src/layouts/Marketing.astro` — shell (nav + footer) for the marketing pages
- `src/styles/global.css` — marketing styles · `src/styles/global-fonts.css` &
  `src/styles/docs.css` — Starlight brand/type overrides

## Commands

```bash
pnpm --filter heirloom-web dev       # dev server
pnpm --filter heirloom-web build     # static build to ./dist
pnpm --filter heirloom-web preview   # preview the build
pnpm --filter heirloom-web lint      # astro check (types)
```

## Configuration

Copy `.env.example` to `.env` and set the public origin, repo URL and the demo
target. All variables are prefixed `PUBLIC_` so they are inlined at build time.

| Variable | Purpose |
| --- | --- |
| `PUBLIC_URL` | Canonical site origin (SEO). |
| `PUBLIC_GITHUB_URL` | Source repository link. |
| `PUBLIC_DEMO_URL` | Read-only public tree view, e.g. `https://heirloom.joachimjasmin.com/view/<token>`. |

The demo target is the `/view/<token>` public snapshot of a seeded tree. Create
it as an admin on a running instance (enable sharing on the demo tree), then set
`PUBLIC_DEMO_URL` to the returned URL.

## Docker

The site is fully static, served by nginx (no backend). The `PUBLIC_*` values are
inlined at **build time** via build-args.

Standalone (build the image and run it on `127.0.0.1:8082`):

```bash
docker compose up -d --build      # from this directory
```

Build the image directly (context is the monorepo root):

```bash
docker build -f apps/heirloom-web/Dockerfile \
  --build-arg PUBLIC_URL=https://heirloom-app.com \
  --build-arg PUBLIC_GITHUB_URL=https://github.com/Jyok1m/heirloom \
  --build-arg PUBLIC_DEMO_URL=https://heirloom.joachimjasmin.com/view/<token> \
  -t jyok1m/heirloom-web:main .
```

In production this image runs as the `web` service in the root
`docker-compose.prod.yml`, built/pushed/deployed by the monorepo `Jenkinsfile`
(the build-args come from the `WEB_*` env in that pipeline).

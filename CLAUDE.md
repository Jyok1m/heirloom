# Heirloom

Application open source et self-hosted de création d'arbre généalogique.
USP : auto-hébergeable, moderne, open source. Les données de famille appartiennent à l'utilisateur, sur sa propre machine.

## Structure du monorepo

- `apps/heirloom-api/` — API NestJS (TypeScript), GraphQL code-first, PostgreSQL via Prisma
- `apps/heirloom-app/` — Frontend React + Vite (TypeScript), Apollo Client + GraphQL Code Generator
- `packages/` — code partagé entre apps. Ne pas y dupliquer les types d'API : ils viennent du schéma GraphQL généré.

Gestionnaire de paquets : **pnpm workspaces**. Ne jamais utiliser npm ou yarn.
Toujours installer une dépendance dans le bon workspace : `pnpm --filter heirloom-api add <pkg>`.

## Commandes

```bash
pnpm dev          # api + app en parallèle
pnpm dev:api      # NestJS en watch (port 3000)
pnpm dev:app      # Vite dev server (port 5173, proxy /api et /graphql -> :3000)
pnpm build        # build de tous les workspaces
pnpm lint         # lint de tous les workspaces

# Base de données (depuis apps/heirloom-api)
pnpm --filter heirloom-api exec prisma migrate dev    # créer/appliquer une migration
pnpm --filter heirloom-api exec prisma studio         # inspecter les données

# Frontend
pnpm --filter heirloom-app codegen    # régénérer types et hooks depuis le schéma GraphQL
```

Postgres tourne en Docker Compose (`docker compose up -d db`), y compris en dev local.
Vérifier qu'un changement compile avant de conclure : `pnpm --filter <workspace> build`.

## Conventions

- TypeScript strict partout. Pas de `any` sauf justification en commentaire.
- API : GraphQL **code-first** (`@nestjs/graphql` + Apollo), un module NestJS par domaine (persons, relationships, trees, media). Inputs validés avec class-validator.
- GraphQL exposé sur `/graphql`. Le REST reste sur `/api`, réservé à ce qui sort du cadre GraphQL (upload de médias, export GEDCOM en fichier).
- Base de données : PostgreSQL via **Prisma**. Toute évolution du modèle passe par une migration Prisma — jamais de modification manuelle du schéma en base.
- Requêtes d'arbre (ancêtres/descendants) : recursive CTE en `$queryRaw` typé, pas de boucles applicatives.
- Tout resolver de relation passe par un **DataLoader** scoped par requête (éviter N+1).
- Frontend : composants fonctionnels + hooks, pas de classe. Client GraphQL : Apollo Client. Après tout changement de schéma ou de query, lancer le codegen — ne jamais écrire les types d'API à la main.
- Les secrets ne vont jamais dans le code ni dans le repo : `.env` (gitignoré), `.env.example` committé et tenu à jour.
- Messages de commit en anglais, format Conventional Commits (`feat:`, `fix:`, `chore:`...).
- Code et identifiants en anglais (projet open source, audience internationale).

## Contexte métier

- Domaine : généalogie. Entités centrales : personne, union/couple, filiation, événement (naissance, mariage, décès), source, média.
- L'import/export **GEDCOM** est un standard du domaine — toute modélisation des entités doit rester compatible avec un mapping GEDCOM futur.
- Self-hosted first : aucune dépendance à un service cloud propriétaire pour fonctionner. Le déploiement cible est Docker Compose (app + Postgres).

## Garde-fous

- Ne pas ajouter de dépendance lourde sans la proposer d'abord.
- Ne pas modifier `pnpm-workspace.yaml`, la structure `apps/` / `packages/`, ni le schéma Prisma sans validation.
- En cas de doute sur un choix d'architecture, poser la question plutôt que de trancher seul.

import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { expand } from 'dotenv-expand';
import { defineConfig } from 'prisma/config';

// Same env file as the NestJS app (repo root .env). expand() resolves the
// ${VAR} interpolations, which plain dotenv leaves verbatim.
expand(loadEnv({ path: path.join(__dirname, '../../.env'), override: true }));

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

const configDir = path.dirname(fileURLToPath(import.meta.url));
// `dotenv/config` only reads `.env` from cwd; migrate is often run from this package,
// while `DATABASE_URL` lives in the monorepo root `.env`.
dotenv.config({ path: path.join(configDir, "../../.env") });
dotenv.config({ path: path.join(configDir, ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Define it in the repo root .env or packages/database/.env, or export it in your shell.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun run prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});

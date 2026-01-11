// prisma.config.ts
import { defineConfig } from "prisma/config";

const url = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;

if (!url) {
  throw new Error("Missing MIGRATE_DATABASE_URL or DATABASE_URL");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url, // should be DIRECT (non-pooler) in production because MIGRATE_DATABASE_URL is set
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL, // optional
  },
});

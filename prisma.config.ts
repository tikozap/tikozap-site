// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

const url =
  process.env.DIRECT_URL ||
  process.env.MIGRATE_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!url) {
  throw new Error("Missing DATABASE_URL (or DIRECT_URL / MIGRATE_DATABASE_URL)");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url },
  migrations: { path: "prisma/migrations" },
});

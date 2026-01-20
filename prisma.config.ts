// prisma.config.ts
import { defineConfig } from "prisma/config";
import { config as dotenvConfig } from "dotenv";

// Local dev convenience (on Vercel, these files won't exist and that's OK)
dotenvConfig({ path: ".env.local" });
dotenvConfig({ path: ".env" });

const url = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("Missing DATABASE_URL (or MIGRATE_DATABASE_URL)");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url },
});

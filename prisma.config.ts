// prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasourceUrl: process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL,
});

// prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  engine: "classic",
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
});

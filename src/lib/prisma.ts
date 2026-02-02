// src/lib/prisma.ts
import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function dbUrl() {
  // For runtime queries, use DATABASE_URL (pooler).
  // For migrations, you already use DIRECT_URL elsewhere.
  const url = process.env.DATABASE_URL || process.env.MIGRATE_DATABASE_URL || "";
  if (!url) throw new Error("Missing DATABASE_URL (or MIGRATE_DATABASE_URL)");
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: dbUrl(),
    // Keep pool small in serverless; safe for local too
    max: process.env.NODE_ENV === "production" ? 5 : 10,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.pgPool = pool;

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

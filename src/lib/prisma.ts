// src/lib/prisma.ts
import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required in .env or .env.local");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === "production" ? 5 : 10, // small pool for serverless
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.pgPool = pool;

const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });
};

type PrismaSingleton = ReturnType<typeof prismaClientSingleton>;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
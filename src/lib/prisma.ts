import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';

function sqliteFilePathFromUrl(input: string): string | null {
  if (!input.startsWith('file:')) return null;

  const raw = input.slice('file:'.length).split('?')[0].split('#')[0];
  if (!raw || raw === ':memory:') return null;

  // file:./prisma/dev.db (relative) or file:/abs/path.db (absolute)
  if (raw.startsWith('/')) return raw;
  return path.resolve(process.cwd(), raw);
}

function ensureSqliteDirectory(input: string) {
  const dbPath = sqliteFilePathFromUrl(input);
  if (!dbPath) return;
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });
}

try {
  ensureSqliteDirectory(url);
} catch (error) {
  console.error('[prisma] Failed to ensure SQLite directory', error);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url }),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// prisma.config.ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Local default (dev)
const DEFAULT_SQLITE_URL = 'file:./prisma/dev.db';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },

  datasource: {
    // Prisma v7: connection goes here
    url: process.env.DATABASE_URL || DEFAULT_SQLITE_URL,
    // (optional) keep directUrl only if you actually use it
    directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL || DEFAULT_SQLITE_URL,
  },
});

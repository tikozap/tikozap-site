// prisma.config.ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const DEFAULT_SQLITE_URL = 'file:./prisma/dev.db';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },

  datasource: {
    url: process.env.DATABASE_URL || DEFAULT_SQLITE_URL,
  },
});

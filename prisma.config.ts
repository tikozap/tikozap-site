// prisma.config.ts
import { defineConfig } from 'prisma/config';

const url = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;

if (!url) throw new Error('Missing MIGRATE_DATABASE_URL or DATABASE_URL');
if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
  throw new Error(`Invalid datasource url. Got: ${url.slice(0, 25)}...`);
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url },
});

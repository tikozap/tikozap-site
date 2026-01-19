// prisma.config.ts
import { defineConfig } from 'prisma/config';
import { config as dotenvConfig } from 'dotenv';

// Load env for Prisma CLI (db pull, studio, migrate)
dotenvConfig({ path: '.env.local' }); // <-- important
dotenvConfig({ path: '.env' });       // optional fallback

const url =
  process.env.DIRECT_URL ||
  process.env.MIGRATE_DATABASE_URL || // optional during transition
  process.env.DATABASE_URL;

if (!url) throw new Error('Missing DIRECT_URL or DATABASE_URL');
if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
  throw new Error(`Invalid datasource url. Got: ${url.slice(0, 25)}...`);
}

// prisma.config.ts
export default {
  schema: "prisma/schema.prisma",
  // choose connection for migrate/introspection tools
  datasourceUrl:
    process.env.DIRECT_URL ||
    process.env.MIGRATE_DATABASE_URL ||
    process.env.DATABASE_URL,
};


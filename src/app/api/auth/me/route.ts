import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await getAuthedUserAndTenant();

  if (!auth?.user || !auth?.tenant) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantName =
    ('storeName' in auth.tenant && auth.tenant.storeName) ||
    ('name' in auth.tenant && auth.tenant.name) ||
    auth.tenant.slug ||
    'Your store';

  return NextResponse.json({
    ok: true,
    user: auth.user,
    tenant: {
      id: auth.tenant.id,
      slug: auth.tenant.slug,
      storeName: tenantName,
      name: tenantName,
    },
  });
}

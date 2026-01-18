import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await getAuthedUserAndTenant();

  if (!auth?.user || !auth?.tenant) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: auth.user.id,
      email: auth.user.email,
      name: auth.user.name ?? null,
    },
    tenant: {
      id: auth.tenant.id,
      slug: auth.tenant.slug,
      auth.tenant.storeName,
    },
  });
}

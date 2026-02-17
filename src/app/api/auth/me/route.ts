import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({
    ok: true,
    user: { id: auth.user.id, email: auth.user.email, name: auth.user.name },
    tenant: {
      id: auth.tenant.id,
      slug: auth.tenant.slug,
      storeName: auth.tenant.storeName,
      starterLinkSlug: auth.tenant.starterLinkSlug,
      starterLinkEnabled: auth.tenant.starterLinkEnabled,
    },
  });
}

import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST() {
  await clearSession();

  const res = NextResponse.json({ ok: true });

  // clear tenant + demo cookies too
  res.cookies.set('tz_tenant', '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
  res.cookies.set('tz_demo_logged_in', '', { path: '/', maxAge: 0 });
  res.cookies.set('tz_demo_tenant_slug', '', { path: '/', maxAge: 0 });
  res.cookies.set('tz_demo_tenant_name', '', { path: '/', maxAge: 0 });

  return res;
}

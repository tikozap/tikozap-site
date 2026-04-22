// src/app/api/auth/demo-login/route.ts

import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

const DEFAULT_DEMO_STORE_NAME = 'Demo Boutique';
const DEFAULT_DEMO_EMAIL = 'owner@demo-boutique.demo';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const emailRaw =
      typeof body.email === 'string' && body.email.trim()
        ? body.email
        : DEFAULT_DEMO_EMAIL;

    const nameRaw = typeof body.name === 'string' ? body.name.trim() : '';
    const storeRaw =
      typeof body.storeName === 'string' && body.storeName.trim()
        ? body.storeName.trim()
        : DEFAULT_DEMO_STORE_NAME;

    const email = emailRaw.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { ok: false, error: 'Valid email required.' },
        { status: 400 }
      );
    }

    const demoUser = {
      id: 'demo-user',
      email,
      name: nameRaw || 'Demo Owner',
    };

    const demoTenant = {
      id: 'demo-tenant',
      slug: 'demo-boutique',
      storeName: storeRaw,
    };

    const token = randomBytes(24).toString('hex');

    const res = NextResponse.json({
      ok: true,
      tenant: demoTenant,
      user: demoUser,
    });

    const commonCookie = {
      httpOnly: true as const,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    };

    res.cookies.set('tz_session', token, commonCookie);
    res.cookies.set('tz_tenant', demoTenant.id, commonCookie);
    res.cookies.set('tz_user_email', demoUser.email, commonCookie);
    res.cookies.set('tz_user_name', demoUser.name, commonCookie);
    res.cookies.set('tz_store_name', demoTenant.storeName, commonCookie);

    return res;
  } catch (error) {
    console.error('[api/auth/demo-login] Failed to create demo session', error);
    return NextResponse.json(
      { ok: false, error: 'Could not start demo session.' },
      { status: 500 }
    );
  }
}
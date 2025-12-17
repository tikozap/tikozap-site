'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const KEY_LOGIN = 'tz_demo_logged_in';
const KEY_ONBOARDED = 'tz_demo_onboarded';
const KEY_TENANT_NAME = 'tz_demo_tenant_name';
const KEY_TENANT_SLUG = 'tz_demo_tenant_slug';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      localStorage.removeItem(KEY_LOGIN);
      localStorage.removeItem(KEY_ONBOARDED);
      localStorage.removeItem(KEY_TENANT_NAME);
      localStorage.removeItem(KEY_TENANT_SLUG);
    } catch {}
    router.replace('/demo-login');
  }, [router]);

  return <div style={{ padding: 24 }}>Signing out…</div>;
}

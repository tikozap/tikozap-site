'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const KEY_LOGIN = 'tz_demo_logged_in';
const KEY_ONBOARDED = 'tz_demo_onboarded';

export default function DemoGate({
  requireLogin,
  requireOnboarded,
  children,
}: {
  requireLogin?: boolean;
  requireOnboarded?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem(KEY_LOGIN) === '1';
    const onboarded = localStorage.getItem(KEY_ONBOARDED) === '1';

    if (requireLogin && !loggedIn) {
      router.replace('/demo-login');
      return;
    }
    if (requireOnboarded && !onboarded) {
      // Option A: never trap users in onboarding
      // Onboarding remains reachable via explicit links
      setOk(true);
      return;
    }
    setOk(true);
  }, [router, requireLogin, requireOnboarded]);

  if (!ok) {
    return <div style={{ padding: '24px' }}>Loading…</div>;
  }

  return <>{children}</>;
}

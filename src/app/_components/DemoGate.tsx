'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const KEY_LOGIN = 'tz_demo_logged_in';

export default function DemoGate({
  children,
  requireLogin = false,
}: {
  children: React.ReactNode;
  requireLogin?: boolean;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem(KEY_LOGIN) === '1';

    if (requireLogin && !loggedIn) {
      setAllowed(false);
      setReady(true);
      router.replace('/demo-login');
      return;
    }

    setAllowed(true);
    setReady(true);
  }, [requireLogin, router]);

  if (!ready) return null;
  return allowed ? <>{children}</> : null;
}

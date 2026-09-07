// src/app/logout/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
        });
      } catch {}

      router.replace('/login');
    })();
  }, [router]);

  return (
    <div style={{ padding: 24 }}>
      Signing out…
    </div>
  );
}

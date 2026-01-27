// src/app/demo-login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Call the API route that sets tz_session + tz_tenant cookies
        const res = await fetch('/api/demo-login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          cache: 'no-store',
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || 'Demo login failed');

        if (!alive) return;

        // Go to app home
        router.replace('/dashboard');
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'Demo login failed');
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-lg font-semibold">Signing you in…</h1>
      <p className="mt-2 text-sm opacity-80">Please wait.</p>
      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

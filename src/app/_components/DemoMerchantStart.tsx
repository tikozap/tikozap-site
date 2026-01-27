// src/app/_components/DemoMerchantStart.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Status = {
  loggedIn: boolean;
  tenantName?: string;
};

export default function DemoMerchantStart() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ loggedIn: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Best-effort: if cookies already exist, show logged-in status
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch('/api/demo-login', { method: 'GET' });
        if (!res.ok) return;

        const data = await res.json().catch(() => ({}));
        if (!alive) return;

        if (data?.ok && data?.tenant) {
          setStatus({
            loggedIn: true,
            tenantName: data.tenant.name || data.tenant.storeName || 'Three Tree Fashion',
          });
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const start = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Demo login failed');

      setStatus({
        loggedIn: true,
        tenantName: data?.tenant?.name || data?.tenant?.storeName || 'Three Tree Fashion',
      });

      // After cookies are set, go to the widget test page (best for Milestone 5)
      router.push('/onboarding/test');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Something went wrong logging in');
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    setError('');
    setLoading(true);

    try {
      // Clear real auth cookies + demo cookies (your /api/auth/logout already does this)
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      setStatus({ loggedIn: false, tenantName: undefined });
      setLoading(false);
      router.refresh();
    }
  };

  return (
    <div
      style={{
        marginTop: 16,
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        padding: 14,
        background: '#fff',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Demo merchant quick start</div>

      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
        Status: {status.loggedIn ? 'Logged in' : 'Logged out'}
        {status.tenantName ? ` • Tenant: ${status.tenantName}` : null}
      </div>

      {error && (
        <div style={{ marginBottom: 10, fontSize: 12, color: '#b91c1c' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={start}
          disabled={loading}
          style={{
            borderRadius: 12,
            padding: '10px 12px',
            border: '1px solid #111827',
            background: loading ? '#4b5563' : '#111827',
            color: '#fff',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.85 : 1,
          }}
        >
          {loading ? 'Continuing…' : 'Continue as Three Tree Fashion'}
        </button>

        <button
          onClick={reset}
          disabled={loading}
          style={{
            borderRadius: 12,
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.85 : 1,
          }}
        >
          Reset demo
        </button>
      </div>
    </div>
  );
}

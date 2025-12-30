'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const KEY_TENANT_NAME = 'tz_demo_tenant_name';
const KEY_LOGIN = 'tz_demo_logged_in';
const KEY_ONBOARDED = 'tz_demo_onboarded';
const KEY_TENANT_SLUG = 'tz_demo_tenant_slug';

type Status = {
  loggedIn: boolean;
  onboarded: boolean;
  tenantName?: string;
};

export default function DemoMerchantStart() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({
    loggedIn: false,
    onboarded: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Optional: on load, see if we already have a valid session cookie
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/demo-login', { method: 'GET' });
        if (!res.ok) return;

        const data = await res.json().catch(() => ({}));
        if (data?.ok && data?.tenant) {
          setStatus({
            loggedIn: true,
            onboarded: true,
            tenantName: data.tenant.name,
          });
        }
      } catch {
        // ignore – this is best-effort only
      }
    })();
  }, []);

// DemoMerchantStart.tsx (ONLY showing the changes inside start())

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

    // ✅ restore demo gate keys (prevents “stuck on /demo-login”)
    try {
      localStorage.setItem(KEY_LOGIN, '1');
      localStorage.setItem(KEY_ONBOARDED, '1');
      localStorage.setItem(KEY_TENANT_NAME, data?.tenant?.name || 'Three Tree Fashion');
      if (data?.tenant?.slug) localStorage.setItem(KEY_TENANT_SLUG, data.tenant.slug);
    } catch {}

    setStatus({
      loggedIn: true,
      onboarded: true,
      tenantName: data.tenant?.name || 'Three Tree Fashion',
    });

    router.push('/dashboard/conversations');
  } catch (err: any) {
    console.error(err);
    setError(err?.message || 'Something went wrong logging in');
    setLoading(false);
  }
};

  const reset = async () => {
    setError('');
    setLoading(true);

    try {
      // optional: implement /api/demo-login/reset later
      await fetch('/api/demo-login/reset', { method: 'POST' }).catch(() => {});
    } finally {
      setStatus({ loggedIn: false, onboarded: false, tenantName: undefined });
      setLoading(false);
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
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        Demo merchant quick start
      </div>

      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
        Status: {status.loggedIn ? 'Logged in' : 'Logged out'} •{' '}
        {status.onboarded ? 'Onboarding complete' : 'Needs onboarding'}
        {status.tenantName ? ` • Tenant: ${status.tenantName}` : null}
      </div>

      {error && (
        <div
          style={{
            marginBottom: 10,
            fontSize: 12,
            color: '#b91c1c',
          }}
        >
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

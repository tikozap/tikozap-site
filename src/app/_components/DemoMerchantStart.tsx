'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const KEY_LOGIN = 'tz_demo_logged_in';
const KEY_ONBOARDED = 'tz_demo_onboarded';
const KEY_TENANT_NAME = 'tz_demo_tenant_name';
const KEY_TENANT_SLUG = 'tz_demo_tenant_slug';

export default function DemoMerchantStart() {
  const router = useRouter();
  const [status, setStatus] = useState<{ loggedIn: boolean; onboarded: boolean }>({
    loggedIn: false,
    onboarded: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loggedIn = localStorage.getItem(KEY_LOGIN) === '1';
    const onboarded = localStorage.getItem(KEY_ONBOARDED) === '1';
    setStatus({ loggedIn, onboarded });
  }, []);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@three-tree-fashion.demo',
          name: 'Demo Owner',
          storeName: 'Three Tree Fashion',
        }),
      });
      const data = await res.json().catch(() => null as any);
      if (!res.ok || !data?.ok || !data?.tenant?.slug) {
        throw new Error(data?.error || 'Could not start demo.');
      }

      localStorage.setItem(KEY_LOGIN, '1');
      // Option A: demo should never trap user in onboarding
      localStorage.setItem(KEY_ONBOARDED, '1');
      localStorage.setItem(KEY_TENANT_NAME, data.tenant.storeName || 'Three Tree Fashion');
      localStorage.setItem(KEY_TENANT_SLUG, data.tenant.slug);
      setStatus({ loggedIn: true, onboarded: true });
      router.push('/dashboard/conversations');
    } catch {
      setError('Could not start demo right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem(KEY_LOGIN);
    localStorage.removeItem(KEY_ONBOARDED);
    localStorage.removeItem(KEY_TENANT_NAME);
    localStorage.removeItem(KEY_TENANT_SLUG);
    setStatus({ loggedIn: false, onboarded: false });
  };

  return (
    <div style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, background: '#fff' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Demo merchant quick start</div>
      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
        Status: {status.loggedIn ? 'Logged in' : 'Logged out'} • {status.onboarded ? 'Onboarding complete' : 'Needs onboarding'}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={start}
          disabled={busy}
          style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid #111827', background: '#111827', color: '#fff', cursor: 'pointer' }}
        >
          {busy ? 'Starting demo...' : 'Continue as Three Tree Fashion'}
        </button>

        <button
          onClick={reset}
          disabled={busy}
          style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
        >
          Reset demo
        </button>
      </div>
      {error ? <div style={{ marginTop: 10, fontSize: 13, color: '#b91c1c' }}>{error}</div> : null}
    </div>
  );
}

// src/app/onboarding/billing/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import OnboardingNav from '../_components/OnboardingNav';

type PlanTier = 'STARTER' | 'PRO' | 'BUSINESS';
type BillingStatus = 'NONE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';

type TenantBilling = {
  id: string;
  storeName: string;
  plan: PlanTier;
  billingStatus: BillingStatus;
  trialEndsAt: string | null;
};

const IS_DEV = process.env.NODE_ENV !== 'production';

function fmtDate(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

async function fetchBilling(): Promise<{ ok: boolean; tenant?: TenantBilling; error?: string; status: number }> {
  const res = await fetch('/api/billing', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ...(data || {}) };
}

async function postBilling(body: any): Promise<{ ok: boolean; tenant?: TenantBilling; error?: string; status: number }> {
  const res = await fetch('/api/billing', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ...(data || {}) };
}

async function ensureDemoLoginOnce(): Promise<void> {
  if (!IS_DEV) return;
  await fetch('/api/demo-login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
    cache: 'no-store',
  }).catch(() => {});
}

export default function BillingStep() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tenant, setTenant] = useState<TenantBilling | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError('');

        let r = await fetchBilling();
        if (r.status === 401) {
          await ensureDemoLoginOnce();
          r = await fetchBilling();
        }

        if (!r.ok) throw new Error(r.error || 'Failed to load billing');
        if (!alive) return;
        setTenant(r.tenant || null);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'Failed to load');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const storeName = useMemo(() => tenant?.storeName || 'your store', [tenant?.storeName]);
  const isTrialing = tenant?.billingStatus === 'TRIALING' && !!tenant?.trialEndsAt;
  const canStartTrial = tenant?.billingStatus === 'NONE' && !tenant?.trialEndsAt;

  async function startTrial() {
    if (saving) return;
    setSaving(true);
    setError('');

    try {
      let r = await postBilling({ startTrial: true });

      if (r.status === 401) {
        await ensureDemoLoginOnce();
        r = await postBilling({ startTrial: true });
      }

      if (!r.ok) throw new Error(r.error || 'Failed to start trial');
      setTenant(r.tenant || tenant);
    } catch (e: any) {
      setError(e?.message || 'Failed to start trial');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Billing</h2>
      <p className="mt-1 text-sm opacity-80">For MVP testing, start with a trial (no card). Stripe wiring later.</p>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        <div className={['rounded-2xl border p-4', isTrialing ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white'].join(' ')}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Start 14-day trial (recommended)</div>
              <p className="mt-1 text-xs opacity-80">Fastest path to test onboarding end-to-end without Stripe.</p>
              {isTrialing ? (
                <div className="mt-2 text-xs">
                  ✅ Trial active for <span className="font-medium">{storeName}</span> until{' '}
                  <span className="font-medium">{fmtDate(tenant?.trialEndsAt || null)}</span>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={startTrial}
              disabled={loading || saving || !canStartTrial}
              className={[
                'rounded-xl px-4 py-2 text-sm font-medium',
                canStartTrial ? 'bg-zinc-900 text-white hover:opacity-90' : 'bg-zinc-200 text-zinc-600 cursor-not-allowed',
              ].join(' ')}
            >
              {saving ? 'Starting…' : isTrialing ? 'Trial started' : 'Start trial'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 opacity-80">
          <div className="text-sm font-semibold">Pay now (Stripe)</div>
          <p className="mt-1 text-xs opacity-80">We’ll wire Stripe Checkout/Payment Element later.</p>
        </div>
      </div>

      <OnboardingNav backHref="/onboarding/plan" nextHref="/onboarding/knowledge" nextLabel="Continue" />
    </div>
  );
}

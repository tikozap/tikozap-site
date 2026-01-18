// src/app/onboarding/plan/page.tsx
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
  // Only used to auto-fix dev demo sessions.
  if (!IS_DEV) return;
  await fetch('/api/demo-login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
    cache: 'no-store',
  }).catch(() => {});
}

function PlanCard({
  title,
  price,
  desc,
  selected,
  disabled,
  onClick,
}: {
  title: string;
  price: string;
  desc: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'w-full text-left rounded-2xl border p-4',
        selected ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white hover:bg-zinc-50',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs opacity-80">{desc}</div>
        </div>
        <div className="text-sm font-semibold">{price}</div>
      </div>

      {selected ? (
        <div className="mt-3 inline-flex rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
          Selected
        </div>
      ) : null}
    </button>
  );
}

export default function PlanStep() {
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

        // Auto-fix: if demo cookies/session missing, create demo login then retry once.
        if (r.status === 401) {
          await ensureDemoLoginOnce();
          r = await fetchBilling();
        }

        if (!r.ok) throw new Error(r.error || 'Failed to load plan');
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

  async function savePlan(next: PlanTier) {
    if (!tenant || saving) return;
    if (tenant.plan === next) return;

    const prev = tenant;
    setTenant({ ...tenant, plan: next });
    setSaving(true);
    setError('');

    try {
      let r = await postBilling({ plan: next });

      if (r.status === 401) {
        await ensureDemoLoginOnce();
        r = await postBilling({ plan: next });
      }

      if (!r.ok) throw new Error(r.error || 'Failed to save plan');
      setTenant(r.tenant || prev);
    } catch (e: any) {
      setTenant(prev);
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Choose a plan</h2>
      <p className="mt-1 text-sm opacity-80">
        Pick a plan for <span className="font-medium">{storeName}</span>.
      </p>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        <PlanCard
          title="Starter"
          price="$19/mo"
          desc="Basic widget + FAQs. Good for small shops."
          selected={tenant?.plan === 'STARTER'}
          disabled={loading || saving}
          onClick={() => savePlan('STARTER')}
        />
        <PlanCard
          title="Pro"
          price="$49/mo"
          desc="Recommended for real stores. More chats + better features."
          selected={tenant?.plan === 'PRO'}
          disabled={loading || saving}
          onClick={() => savePlan('PRO')}
        />
        <PlanCard
          title="Business"
          price="$99/mo"
          desc="Higher limits + team features. Best for growing shops."
          selected={tenant?.plan === 'BUSINESS'}
          disabled={loading || saving}
          onClick={() => savePlan('BUSINESS')}
        />
      </div>

      <div className="mt-3 text-xs opacity-70">{loading ? 'Loading…' : saving ? 'Saving…' : ' '}</div>

      <OnboardingNav backHref="/onboarding/store" nextHref="/onboarding/billing" />
    </div>
  );
}

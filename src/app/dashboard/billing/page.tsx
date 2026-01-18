// src/app/dashboard/billing/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

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

function PlanButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'rounded-xl border px-4 py-2 text-sm',
        active ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white hover:bg-zinc-50',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export default function BillingPage() {
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

  const canStartTrial = tenant?.billingStatus === 'NONE' && !tenant?.trialEndsAt;

  const statusLine = useMemo(() => {
    if (!tenant) return '';
    if (tenant.billingStatus === 'TRIALING' && tenant.trialEndsAt) {
      return `Trial active until ${fmtDate(tenant.trialEndsAt)}`;
    }
    return `Status: ${tenant.billingStatus}`;
  }, [tenant]);

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

  async function startTrial() {
    if (!tenant || saving) return;
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
      <h1 className="db-title">Billing</h1>
      <p className="db-sub">Plan + trial state (Stripe later).</p>

      {error ? (
        <div style={{ marginTop: 12 }} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div style={{ marginTop: 14 }} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold">Current plan</div>

        <div className="mt-2 flex flex-wrap gap-2">
          <PlanButton label="Starter" active={tenant?.plan === 'STARTER'} disabled={loading || saving} onClick={() => savePlan('STARTER')} />
          <PlanButton label="Pro" active={tenant?.plan === 'PRO'} disabled={loading || saving} onClick={() => savePlan('PRO')} />
          <PlanButton
            label="Business"
            active={tenant?.plan === 'BUSINESS'}
            disabled={loading || saving}
            onClick={() => savePlan('BUSINESS')}
          />
        </div>

        <div className="mt-3 text-xs opacity-80">{loading ? 'Loading…' : statusLine}</div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startTrial}
            disabled={loading || saving || !canStartTrial}
            className={['db-btn', 'primary', canStartTrial ? '' : 'opacity-60 cursor-not-allowed'].join(' ')}
          >
            {saving ? 'Working…' : canStartTrial ? 'Start 14-day trial' : 'Trial already started'}
          </button>

          <div className="text-xs opacity-70">(Stripe payment UI comes next.)</div>
        </div>
      </div>
    </div>
  );
}

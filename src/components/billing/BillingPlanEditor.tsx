// src/components/billing/BillingPlanEditor.tsx
'use client';

import { useEffect, useState } from 'react';

type Plan = 'STARTER' | 'PRO' | 'BUSINESS';
type BillingStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled';

const PLANS: Array<{ key: Plan; title: string; price: string; desc: string }> = [
  { key: 'STARTER', title: 'Starter', price: '$19/mo', desc: 'Basic widget + FAQs. Good for small shops.' },
  { key: 'PRO', title: 'Pro', price: '$49/mo', desc: 'Recommended for real stores. More chats + better features.' },
  { key: 'BUSINESS', title: 'Business', price: '$99/mo', desc: 'Higher limits + team features. Best for growing shops.' },
];

export default function BillingPlanEditor({
  mode,
}: {
  mode: 'onboarding-plan' | 'onboarding-billing' | 'dashboard';
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [plan, setPlan] = useState<Plan>('PRO');
  const [status, setStatus] = useState<BillingStatus>('none');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/billing', { method: 'GET' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to load billing');

      setPlan((data?.billing?.plan as Plan) || 'PRO');
      setStatus((data?.billing?.status as BillingStatus) || 'none');
      setTrialEndsAt(data?.billing?.trialEndsAt || null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load billing');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function choosePlan(next: Plan) {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'set_plan', plan: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to save plan');

      setPlan((data?.billing?.plan as Plan) || next);
      setStatus((data?.billing?.status as BillingStatus) || status);
      setTrialEndsAt(data?.billing?.trialEndsAt || null);
    } catch (e: any) {
      setError(e?.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  async function startTrial() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'start_trial' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to start trial');

      setStatus((data?.billing?.status as BillingStatus) || 'trialing');
      setTrialEndsAt(data?.billing?.trialEndsAt || null);
    } catch (e: any) {
      setError(e?.message || 'Failed to start trial');
    } finally {
      setSaving(false);
    }
  }

  const showPlan = mode !== 'onboarding-billing';
  const showBilling = mode !== 'onboarding-plan';

  const prettyTrialEnds =
    trialEndsAt ? new Date(trialEndsAt).toLocaleDateString() : null;

  return (
    <div className="mt-6 grid gap-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {showPlan ? (
        <div>
          <div className="text-sm font-semibold">Plan</div>
          <div className="mt-3 grid gap-3">
            {PLANS.map((p) => {
              const selected = p.key === plan;
              return (
                <button
                  key={p.key}
                  type="button"
                  disabled={loading || saving}
                  onClick={() => choosePlan(p.key)}
                  className={[
                    'text-left rounded-2xl border p-4',
                    selected ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white',
                    (loading || saving) ? 'opacity-70' : '',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">{p.title}</div>
                      <div className="mt-1 text-xs opacity-80">{p.desc}</div>
                    </div>
                    <div className="text-sm font-semibold">{p.price}</div>
                  </div>
                  {selected ? (
                    <div className="mt-3 inline-flex rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                      Selected
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs opacity-70">
            {saving ? 'Saving…' : 'Click a plan to save.'}
          </div>
        </div>
      ) : null}

      {showBilling ? (
        <div>
          <div className="text-sm font-semibold">Billing status</div>
          <div className="mt-2 text-sm opacity-80">
            Status: <span className="font-medium">{status}</span>
            {prettyTrialEnds ? (
              <span className="opacity-80"> · Trial ends: {prettyTrialEnds}</span>
            ) : null}
          </div>

          <div className="mt-3 grid gap-3">
            <div className="rounded-2xl border border-zinc-900 bg-zinc-50 p-4">
              <div className="text-sm font-semibold">Start 14-day trial (recommended for testing)</div>
              <p className="mt-1 text-xs opacity-80">
                Fastest path to test onboarding end-to-end without Stripe wiring.
              </p>
              <button
                type="button"
                disabled={loading || saving}
                onClick={startTrial}
                className="mt-3 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {saving ? 'Working…' : 'Start trial'}
              </button>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold">Pay now (Stripe)</div>
              <p className="mt-1 text-xs opacity-80">
                We’ll wire Stripe Checkout/Payment Element next. (UI only for now.)
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

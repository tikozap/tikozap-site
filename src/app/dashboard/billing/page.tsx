// src/app/dashboard/billing/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MobilePageHeader from '../_components/MobilePageHeader';
import { PRICING_PLANS } from '@/lib/pricingPlans';

type BillingPlan = 'starter' | 'pro' | 'business';

type BillingUsage = {
  plan: BillingPlan;
  billingStatus?: string;

  monthlyLimit: number;
  usedConversations: number;
  remainingConversations: number;
  utilizationPct: number;

  isNearLimit: boolean;
  isOverLimit: boolean;

  windowStart: string;
  windowEnd: string;

  voice: {
    enabled: boolean;

    pack: string | null;

    usedMinutes: number;
    limitMinutes: number;
    remainingMinutes: number;

    utilizationPct: number;

    periodStart: string | null;
  };
};

const PLAN_OPTIONS = {
  monthly: [
    {
      plan: 'starter',
      label: PRICING_PLANS.starter.name,
      price: `$${PRICING_PLANS.starter.monthly}/mo`,
    },
    {
      plan: 'pro',
      label: PRICING_PLANS.pro.name,
      price: `$${PRICING_PLANS.pro.monthly}/mo`,
    },
    {
      plan: 'business',
      label: PRICING_PLANS.business.name,
      price: `$${PRICING_PLANS.business.monthly}/mo`,
    },
  ],

  yearly: [
    {
      plan: 'starter-yearly',
      label: PRICING_PLANS.starter.name,
      price: '$16/mo billed yearly',
    },
    {
      plan: 'pro-yearly',
      label: PRICING_PLANS.pro.name,
      price: '$24/mo billed yearly',
    },
    {
      plan: 'business-yearly',
      label: PRICING_PLANS.business.name,
      price: '$49/mo billed yearly',
    },
  ],
};

function prettyPlan(plan: BillingPlan): string {
  if (plan === 'pro') return 'Pro';
  if (plan === 'business') return 'Business';
  return 'Starter';
}

function monthLabel(startIso: string): string {
  const date = new Date(startIso);
  return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

export default function BillingPage() {
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [error, setError] = useState('');
  const [savingPlan, setSavingPlan] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [banner, setBanner] = useState('');
  const [billingMode, setBillingMode] = useState<'monthly' | 'yearly'>('monthly');

  const openCustomerPortal = async () => {
  setNotice('');

  try {
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok || !data?.url) {
      throw new Error(data?.error || 'Could not open billing portal.');
    }

    window.location.href = data.url;
  } catch (err: any) {
    setNotice(err?.message || 'Could not open billing portal.');
  }
};

  const loadUsage = async () => {
    try {
      setError('');
      const res = await fetch('/api/billing/usage', { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data?.usage) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      setUsage(data.usage as BillingUsage);
    } catch {
      setError('Billing usage unavailable right now.');
    }
  };

  useEffect(() => {
    void loadUsage();
  }, []);

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  if (params.get('success') === '1') {
    setBanner('Subscription updated successfully.');
  }

  if (params.get('canceled') === '1') {
    setBanner('Checkout canceled.');
  }
}, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectedPlan = usage?.plan ?? 'starter';
  const progressColor = useMemo(() => {
    if (!usage) return '#111827';
    if (usage.isOverLimit) return '#b91c1c';
    if (usage.isNearLimit) return '#b45309';
    return '#111827';
  }, [usage]);

const changePlan = async (plan: string) => {
  if (plan === selectedPlan || savingPlan) return;

  setSavingPlan(plan);
  setNotice('');

  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok || !data?.url) {
      throw new Error(data?.error || 'Could not start checkout.');
    }

    window.location.href = data.url;
  } catch (err: any) {
    setNotice(err?.message || 'Could not start checkout.');
    setSavingPlan(null);
  }
};

const configureVoice = async (
  action: 'enable' | 'disable',
  pack?: 'starter' | 'pro' | 'business'
) => {
  setNotice('');

  try {
    const res = await fetch('/api/voice/config', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        action,
        pack,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      throw new Error(
        data?.error || 'Could not update voice settings.'
      );
    }

    await loadUsage();

    setNotice(
      action === 'disable'
        ? 'Voice disabled successfully.'
        : 'Voice pack updated successfully.'
    );
  } catch (err: any) {
    setNotice(
      err?.message || 'Could not update voice settings.'
    );
  }
};

const startVoiceCheckout = async (pack: 'starter' | 'pro' | 'business') => {
  setNotice('');

  try {
    const res = await fetch('/api/stripe/voice-checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pack }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok || !data?.url) {
      throw new Error(data?.error || 'Could not start voice checkout.');
    }

    window.location.href = data.url;
  } catch (err: any) {
    setNotice(err?.message || 'Could not start voice checkout.');
  }
};

  return (
    <div className="db-container">
      <MobilePageHeader title="Billing" />

      <div className="db-pageStack">
        <h1 className="db-title">Billing</h1>
        <p className="db-sub">
          Usage limits are enforced monthly by plan. Manage your subscription and usage here.
        </p>

{banner ? (
  <div className="db-card">
    <p
      className="db-cardText"
      style={{
        color: banner.toLowerCase().includes('canceled')
          ? '#b45309'
          : '#065f46',
      }}
    >
      {banner}
    </p>
  </div>
) : null}   

        {/* Current plan */}
        <div className="db-card">
          <div className="db-cardTitle">Current plan</div>

          {error ? (
            <p className="db-cardText" style={{ color: '#b91c1c' }}>{error}</p>
          ) : !usage ? (
            <p className="db-cardText">Loading…</p>
          ) : (
            <>
              <p className="db-cardText">
                {prettyPlan(usage.plan)}
                {usage.billingStatus === 'trialing' ? (
                  <span
                   style={{
                     marginLeft: 6,
                     padding: '2px 7px',
                     borderRadius: 999,
                     background: '#ecfdf5',
                     color: '#047857',
                     fontSize: 12,
                     fontWeight: 800,
                   }}
                 >
                   Trial
                 </span>
                ) : null}
                 {' '}· {usage.usedConversations}/{usage.monthlyLimit} conversations used (
                {usage.utilizationPct}%)
              </p>
              <p className="db-cardText" style={{ fontSize: 13 }}>
                Billing window: {monthLabel(usage.windowStart)}
              </p>

              <div
                style={{
                  marginTop: 10,
                  width: '100%',
                  height: 10,
                  borderRadius: 999,
                  background: '#e5e7eb',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    height: '100%',
                    width: `${Math.min(100, usage.utilizationPct)}%`,
                    background: progressColor,
                    borderRadius: 999,
                    transition: 'width 180ms ease',
                  }}
                />
              </div>

              {usage.isOverLimit ? (
                <p className="db-cardText" style={{ color: '#b91c1c' }}>
                  Limit reached. Upgrade plan to allow new conversations this month.
                </p>
              ) : usage.isNearLimit ? (
                <p className="db-cardText" style={{ color: '#b45309' }}>
                  Near monthly limit. Consider upgrading to avoid interruptions.
                </p>
              ) : (
                <p className="db-cardText" style={{ color: '#065f46' }}>
                  Remaining this month: {usage.remainingConversations} conversations.
                </p>
              )}
            </>
          )}
        </div>

        {/* Change plan */}
        <div className="db-card">
          <div className="db-cardTitle">Change plan</div>
          <p className="db-cardText">
            Secure checkout powered by Stripe (test mode).
          </p>

<div
  style={{
    marginTop: 12,
    display: 'inline-flex',
    border: '1px solid #e5e7eb',
    borderRadius: 999,
    padding: 4,
    gap: 4,
    background: '#f8fafc',
  }}
>
  <button
    type="button"
    onClick={() => setBillingMode('monthly')}
    className="db-btn"
    style={{
      background: billingMode === 'monthly' ? '#111827' : 'transparent',
      color: billingMode === 'monthly' ? '#fff' : '#111827',
      border: 'none',
    }}
  >
    Monthly
  </button>

  <button
    type="button"
    onClick={() => setBillingMode('yearly')}
    className="db-btn"
    style={{
      background: billingMode === 'yearly' ? '#111827' : 'transparent',
      color: billingMode === 'yearly' ? '#fff' : '#111827',
      border: 'none',
    }}
  >
    Yearly
  </button>
</div>

<div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
  {PLAN_OPTIONS[billingMode].map((option: any) => {
    const normalizedPlan = option.plan.replace('-yearly', '');
    const active = normalizedPlan === selectedPlan;

    return (
      <button
        key={option.plan}
        type="button"
        className={`db-btn ${active ? 'primary' : ''}`}
        onClick={() => changePlan(option.plan)}
        disabled={savingPlan !== null}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <span>{active ? `${option.label} (Current)` : option.label}</span>
        <span style={{ opacity: 0.8, fontSize: 12 }}>
          {option.price}
        </span>
      </button>
    );
  })}
</div>

        <div style={{ marginTop: 12 }}>
  <button
    type="button"
    className="db-btn"
    onClick={openCustomerPortal}
  >
    Manage subscription
  </button>
</div>

          {notice ? (
            <p
              className="db-cardText"
              style={{
                color: notice.toLowerCase().includes('could not') ? '#b91c1c' : '#065f46',
              }}
            >
              {notice}
            </p>
          ) : null}
        </div>

{/* Realtime Voice Concierge */}
<div className="db-card">
  <div className="db-cardTitle">
    Realtime Voice Concierge
  </div>

  {!usage ? (
    <p className="db-cardText">Loading…</p>
  ) : !usage.voice.enabled ? (
    <>
      <p className="db-cardText">
        Voice is currently disabled for this store.
      </p>

      <p
        className="db-cardText"
        style={{ fontSize: 13, color: '#6b7280' }}
      >
        Enable realtime voice as an optional premium add-on.
      </p>

      <div
  style={{
    marginTop: 12,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  }}
>
  <button
    type="button"
    className="db-btn"
    onClick={() =>
      startVoiceCheckout('starter')
    }
  >
    Voice Starter · 100 min · $19
  </button>

  <button
    type="button"
    className="db-btn"
    onClick={() =>
      startVoiceCheckout('pro')
    }
  >
    Voice Pro · 500 min · $69
  </button>

  <button
    type="button"
    className="db-btn"
    onClick={() =>
      startVoiceCheckout('business')
    }
  >
    Voice Business · 2000 min · $199
  </button>
</div>
    </>
  ) : (
    <>
      <p className="db-cardText">
        {usage.voice.pack || 'Voice'} ·{' '}
        {usage.voice.usedMinutes}/
        {usage.voice.limitMinutes} minutes used
      </p>

      <div
        style={{
          marginTop: 10,
          width: '100%',
          height: 10,
          borderRadius: 999,
          background: '#e5e7eb',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${Math.min(
              100,
              usage.voice.utilizationPct
            )}%`,
            background:
              usage.voice.utilizationPct >= 90
                ? '#b91c1c'
                : usage.voice.utilizationPct >= 70
                ? '#b45309'
                : '#111827',
            borderRadius: 999,
            transition: 'width 180ms ease',
          }}
        />
      </div>

      <p
        className="db-cardText"
        style={{
          marginTop: 10,
          color:
            usage.voice.remainingMinutes <= 0
              ? '#b91c1c'
              : '#065f46',
        }}
      >
        Remaining this month:{' '}
        {usage.voice.remainingMinutes} minutes
      </p>

      <div
  style={{
    marginTop: 12,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  }}
>
  <button
    type="button"
    className="db-btn"
    onClick={() => startVoiceCheckout('starter')}
  >
    Voice Starter
  </button>

  <button
    type="button"
    className="db-btn"
    onClick={() => startVoiceCheckout('pro')}
  >
    Voice Pro
  </button>

  <button
    type="button"
    className="db-btn"
    onClick={() => startVoiceCheckout('business')}
  >
    Voice Business
  </button>

  <button
    type="button"
    className="db-btn"
    onClick={() =>
      configureVoice('disable')
    }
  >
    Disable Voice
  </button>
</div>
    </>
  )}
</div>

        {/* Quick links */}
        <div className="db-card">
          <div className="db-cardTitle">Quick links</div>
          <p className="db-cardText">
            Use onboarding billing for setup flow, then manage usage here.
          </p>

          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="db-btn" href="/onboarding/billing">
              Open billing step
            </Link>
            <Link className="db-btn" href="/pricing">
              View pricing page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
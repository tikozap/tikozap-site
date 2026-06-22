// src/app/dashboard/billing/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import MobilePageHeader from '../_components/MobilePageHeader';
import { PRICING_PLANS } from '@/lib/pricingPlans';

type BillingPlan = 'starter' | 'pro' | 'business';

type BillingUsage = {
  plan: BillingPlan;
  billingStatus?: string;
  billingInterval?: 'monthly' | 'yearly';
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;

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

  freeQuestionsLimitDaily: number;
  freeQuestionsUsedToday: number;
  freeQuestionsRemainingToday: number;
  freeQuestionsDate: string | null;
  freeQuestionsTotal: number;
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
  return date.toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function dateLabel(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
  if (usage?.billingInterval === 'yearly') {
    setBillingMode('yearly');
  } else if (usage?.billingInterval === 'monthly') {
    setBillingMode('monthly');
  }
}, [usage?.billingInterval]);

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
  const clickedBasePlan = plan.replace('-yearly', '');
const clickedInterval = plan.endsWith('-yearly') ? 'yearly' : 'monthly';

if (
  savingPlan ||
  (clickedBasePlan === selectedPlan && clickedInterval === usage?.billingInterval)
) {
  return;
}

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
  if (pack === usage?.voice.pack) return;

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

{usage.cancelAtPeriodEnd && usage.currentPeriodEnd ? (
  <p
    className="db-cardText"
    style={{
      fontSize: 13,
      color: '#b45309',
      fontWeight: 700,
    }}
  >
    Your plan is scheduled to cancel on {dateLabel(usage.currentPeriodEnd)}.
  </p>
) : null}

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
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0,
    padding: 0,
    borderRadius: 9999,
    border: '1px solid #e5e7eb',
    background: '#f3f4f6',
  }}
>
<button
  type="button"
  onClick={() => setBillingMode('monthly')}
  style={{
    border: 'none',
    background:
      billingMode === 'monthly' ? '#111827' : 'transparent',
    color:
      billingMode === 'monthly' ? '#ffffff' : '#6b7280',
    padding: '5px 12px',
fontSize: 13,
fontWeight: 700,
lineHeight: 1,
    borderRadius: '9999px',
    cursor: 'pointer',
    boxShadow:
      billingMode === 'monthly'
        ? '0 4px 10px rgba(17, 24, 39, 0.25)'
        : 'none',
  }}
>
  Monthly
</button>

<button
  type="button"
  onClick={() => setBillingMode('yearly')}
  style={{
    border: 'none',
    background:
      billingMode === 'yearly' ? '#111827' : 'transparent',
    color:
      billingMode === 'yearly' ? '#ffffff' : '#6b7280',
    padding: '5px 16px',
fontSize: 13,
fontWeight: 700,
lineHeight: 1,
    borderRadius: '9999px',
    cursor: 'pointer',
    boxShadow:
      billingMode === 'yearly'
        ? '0 4px 10px rgba(17, 24, 39, 0.25)'
        : 'none',
  }}
>
  Yearly
</button>
</div>

<p
  style={{
    marginTop: 8,
    marginBottom: 0,
    fontSize: 13,
    color: '#6b7280',
  }}
>
  Pay annually and save 20%.
</p>

<div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
  {PLAN_OPTIONS[billingMode].map((option: any) => {
    const normalizedPlan = option.plan.replace('-yearly', '');
const optionInterval = option.plan.endsWith('-yearly') ? 'yearly' : 'monthly';

const active =
  normalizedPlan === selectedPlan &&
  optionInterval === usage?.billingInterval;

    return (
    <button
  key={option.plan}
  type="button"
  className="db-btn"
  onClick={() => changePlan(option.plan)}
  disabled={savingPlan !== null}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: active ? '#e5e7eb' : '#fff',
    borderColor: active ? '#cbd5e1' : '#d1d5db',
    fontWeight: active ? 800 : 600,
  }}
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
  <div className="db-cardTitle">Realtime Voice Concierge</div>

  {!usage ? (
    <p className="db-cardText">Loading…</p>
  ) : (
    <>
      <div
        style={{
          marginTop: 8,
          marginBottom: 12,
          padding: '12px 14px',
          borderRadius: 10,
          background: '#ecfdf5',
          border: '1px solid #bbf7d0',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46' }}>
          Free voice included
        </div>

        <div style={{ marginTop: 4, fontSize: 13, color: '#047857' }}>
          Every store gets 20 free voice questions per day, even without a voice subscription.
        </div>
      </div>

      <p className="db-cardText" style={{ fontWeight: 700 }}>
        Today&apos;s free voice usage
      </p>

      <p className="db-cardText">
{Math.min(
  usage.voice.freeQuestionsUsedToday || 0,
  usage.voice.freeQuestionsLimitDaily || 20
)}
/
{usage.voice.freeQuestionsLimitDaily || 20} free questions used today
      </p>

      <div
        style={{
          marginTop: 8,
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
              Math.round(
                ((usage.voice.freeQuestionsUsedToday || 0) /
                  (usage.voice.freeQuestionsLimitDaily || 20)) *
                  100
              )
            )}%`,
            background: '#111827',
            borderRadius: 999,
            transition: 'width 180ms ease',
          }}
        />
      </div>

      {usage.voice.freeQuestionsRemainingToday <= 0 ? (
  <p
    className="db-cardText"
    style={{
      marginTop: 8,
      color: '#b45309',
      fontWeight: 700,
    }}
  >
   {usage.voice.freeQuestionsRemainingToday <= 0 ? (
  <p
    className="db-cardText"
    style={{
      marginTop: 8,
      color: usage.voice.enabled ? '#065f46' : '#b45309',
      fontWeight: 700,
    }}
  >
    {usage.voice.enabled
      ? 'Daily free voice questions used. Paid voice minutes are now being used.'
      : 'Daily free voice limit reached. Upgrade to a voice plan or continue tomorrow.'}
  </p>
) : (
  <p className="db-cardText" style={{ marginTop: 8, color: '#065f46' }}>
    Remaining today: {usage.voice.freeQuestionsRemainingToday ?? 20} free questions
  </p>
)}
  </p>
) : (
  <p className="db-cardText" style={{ marginTop: 8, color: '#065f46' }}>
    Remaining today: {usage.voice.freeQuestionsRemainingToday ?? 20} free questions
  </p>
)}

      {usage.voice.enabled ? (
        <>
          <p className="db-cardText" style={{ marginTop: 14 }}>
            {usage.voice.pack
              ? `Voice ${usage.voice.pack.charAt(0).toUpperCase()}${usage.voice.pack.slice(1)}`
              : 'Voice'}{' '}
            · {usage.voice.usedMinutes}/{usage.voice.limitMinutes} minutes used this month
          </p>

          <div
            style={{
              marginTop: 8,
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
                width: `${Math.min(100, usage.voice.utilizationPct)}%`,
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
              marginTop: 8,
              color: usage.voice.remainingMinutes <= 0 ? '#b91c1c' : '#065f46',
            }}
          >
            Remaining this month: {usage.voice.remainingMinutes} minutes
          </p>
        </>
      ) : (
        <p className="db-cardText" style={{ fontSize: 13, color: '#6b7280' }}>
          Need more voice? Upgrade anytime for monthly voice minutes.
        </p>
      )}

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
  style={{
    background: usage.voice.pack === 'starter' ? '#e5e7eb' : '#fff',
    borderColor: usage.voice.pack === 'starter' ? '#cbd5e1' : '#d1d5db',
    fontWeight: usage.voice.pack === 'starter' ? 800 : 600,
  }}
>
  {usage.voice.pack === 'starter'
    ? 'Voice Starter (Current) · 100 min · $9'
    : 'Voice Starter · 100 min · $9'}
</button>

<button
    type="button"
    className="db-btn"
    onClick={() => startVoiceCheckout('pro')}
    style={{
    background: usage.voice.pack === 'pro' ? '#e5e7eb' : '#fff',
    borderColor: usage.voice.pack === 'pro' ? '#cbd5e1' : '#d1d5db',
    fontWeight: usage.voice.pack === 'pro' ? 800 : 600,
  }}
>
  {usage.voice.pack === 'pro'
    ? 'Voice Pro (Current) · 500 min · $29'
    : 'Voice Pro · 500 min · $29'}
</button>

<button
    type="button"
    className="db-btn"
    onClick={() => startVoiceCheckout('business')}
    style={{
    background: usage.voice.pack === 'business' ? '#e5e7eb' : '#fff',
    borderColor: usage.voice.pack === 'business' ? '#cbd5e1' : '#d1d5db',
    fontWeight: usage.voice.pack === 'business' ? 800 : 600,
  }}
>
  {usage.voice.pack === 'business'
    ? 'Voice Business (Current) · 2000 min · $99'
    : 'Voice Business · 2000 min · $99'}
</button>

<button
  type="button"
  className="db-btn"
  onClick={openCustomerPortal}
>
  Manage voice subscription
</button>
      </div>
    </>
  )}
</div>
      </div>
    </div>
  );
}
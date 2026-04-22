// src/app/dashboard/billing/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MobilePageHeader from '../_components/MobilePageHeader';

type BillingPlan = 'starter' | 'pro' | 'business';

type BillingUsage = {
  plan: BillingPlan;
  monthlyLimit: number;
  usedConversations: number;
  remainingConversations: number;
  utilizationPct: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
  windowStart: string;
  windowEnd: string;
};

const PLAN_OPTIONS: Array<{ plan: BillingPlan; label: string; price: string }> = [
  { plan: 'starter', label: 'Starter', price: '$15/mo' },
  { plan: 'pro', label: 'Pro', price: '$35/mo' },
  { plan: 'business', label: 'Business', price: '$69/mo' },
];

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
  const [savingPlan, setSavingPlan] = useState<BillingPlan | null>(null);
  const [notice, setNotice] = useState('');

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

  const changePlan = async (plan: BillingPlan) => {
    if (!usage || plan === usage.plan || savingPlan) return;
    setSavingPlan(plan);
    setNotice('');
    try {
      const res = await fetch('/api/billing/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data?.usage) {
        throw new Error(data?.error || 'Could not update plan.');
      }
      setUsage(data.usage as BillingUsage);
      setNotice(`Plan updated to ${prettyPlan(plan)}.`);
    } catch (err: any) {
      setNotice(err?.message || 'Could not update plan.');
    } finally {
      setSavingPlan(null);
    }
  };

  return (
    <div className="db-container">
      <MobilePageHeader title="Billing" />

      <div className="db-pageStack">
        <h1 className="db-title">Billing</h1>
        <p className="db-sub">
          Usage limits are enforced monthly by plan. Payment wiring can be added later.
        </p>

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
                {prettyPlan(usage.plan)} · {usage.usedConversations}/{usage.monthlyLimit} conversations used (
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
            MVP plan switcher (no Stripe checkout yet).
          </p>

          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PLAN_OPTIONS.map((option: any) => {
              const active = option.plan === selectedPlan;
              return (
                <button
                  key={option.plan}
                  type="button"
                  className={`db-btn ${active ? 'primary' : ''}`}
                  onClick={() => changePlan(option.plan)}
                  disabled={savingPlan !== null}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span>{option.label}</span>
                  <span style={{ opacity: 0.8, fontSize: 12 }}>{option.price}</span>
                </button>
              );
            })}
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
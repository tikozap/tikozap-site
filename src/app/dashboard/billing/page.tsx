import Link from 'next/link';

export default function BillingPage() {
  return (
    <div>
      <h1 className="db-title">Billing</h1>
      <p className="db-sub">Trial/plan/payment state. Stripe wiring later.</p>

      <div style={{ marginTop: 14, border: '1px solid #e5e7eb', borderRadius: 16, padding: 14, background: '#fff' }}>
        <div style={{ fontWeight: 800 }}>Quick link</div>
        <p style={{ marginTop: 6, opacity: 0.8 }}>
          Currently the billing choice is in onboarding.
        </p>
        <Link className="db-btn primary" href="/onboarding/billing" style={{ display: 'inline-flex', marginTop: 10 }}>
          Open Billing Step
        </Link>
      </div>
    </div>
  );
}

import Link from 'next/link';

export default function MerchantOverview() {
  return (
    <div>
      <div className="db-top">
        <div>
          <h1 className="db-title">Overview</h1>
          <p className="db-sub">Your assistant is ready to be tested. Next: connect real conversations + widget preview.</p>
        </div>
        <div className="db-actions">
          <Link className="db-btn" href="/onboarding/knowledge">Edit Knowledge</Link>
          <Link className="db-btn primary" href="/dashboard/conversations">Open Inbox</Link>
        </div>
      </div>

      <div className="db-grid">
        <div className="db-card db-tile">
          <h3>Conversations</h3>
          <p>See customer questions and how the assistant answered.</p>
        </div>

        <div className="db-card db-tile">
          <h3>Knowledge</h3>
          <p>Returns, shipping, sizing, FAQs — your assistant’s brain.</p>
        </div>

        <div className="db-card db-tile">
          <h3>Widget</h3>
          <p>Customize appearance + install snippet for your site.</p>
        </div>

        <div className="db-card db-tile">
          <h3>Billing</h3>
          <p>Plan and payment settings (Stripe wiring later).</p>
        </div>
      </div>
    </div>
  );
}

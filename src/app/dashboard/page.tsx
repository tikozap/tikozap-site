// src/app/dashboard/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export default async function MerchantOverview() {
  const authed = await getAuthedUserAndTenant();
  if (!authed?.tenant?.id) redirect('/login');

  const tenantId = authed.tenant.id;

  const widget = await prisma.widget.findUnique({
    where: { tenantId },
    select: { assistantName: true, greeting: true, brandColor: true },
  });

  const needsWidget = !widget?.assistantName || !widget?.greeting || !widget?.brandColor;

  // ✅ Gate ONLY the overview page
  if (needsWidget) redirect('/onboarding/widget');

  return (
    <div>
      <div className="db-top">
        <div>
          <h1 className="db-title">Overview</h1>
          <p className="db-sub">
            Your assistant is ready to be tested. Next: connect real conversations + widget preview.
          </p>
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

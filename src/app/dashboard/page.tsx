// src/app/dashboard/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import SupportMetricsCards from './_components/SupportMetricsCards';
import DesignPartnerRolloutCard from './_components/DesignPartnerRolloutCard';
import CaseStudyExportCard from './_components/CaseStudyExportCard';

export default async function MerchantOverview() {
  const authed = await getAuthedUserAndTenant();
  if (!authed?.tenant?.id) redirect('/demo-login?autostart=1&next=/dashboard');

  const tenantId = authed.tenant.id;

  return (
    <div className="db-container">
      {/* Header – keep Cursor's version but tighten spacing */}
      <header className="db-header">
        <div>
          <h1 className="db-title">Overview</h1>
          <p className="db-sub">
            Track support quality, rollout progress, and key metrics. Tune knowledge and channels from here.
          </p>
        </div>
        <div className="db-actions">
          <Link href="/onboarding/knowledge" className="db-btn">Edit Knowledge</Link>
          <Link href="/onboarding/install" className="db-btn">Starter Link Setup</Link>
          <Link href="/dashboard/conversations" className="db-btn primary">Open Inbox</Link>
        </div>
      </header>

      {/* Metrics – keep Cursor's card, but make full-width */}
      <section className="db-section db-metrics">
        <SupportMetricsCards />
      </section>

      {/* Rollout – keep Cursor's card, full-width */}
      <section className="db-section db-rollout">
        <DesignPartnerRolloutCard />
      </section>

      {/* Export – keep Cursor's card, full-width */}
      <section className="db-section db-export">
        <CaseStudyExportCard />
      </section>

      {/* Quick tiles – restore old simple tiles, but in 2-column grid on desktop */}
      <section className="db-section db-quick-tiles">
        <div className="db-tile">
          <h3>Conversations</h3>
          <p>See customer questions and how the assistant answered.</p>
          <Link href="/dashboard/conversations" className="db-link">Go to Inbox →</Link>
        </div>
        <div className="db-tile">
          <h3>Knowledge</h3>
          <p>Returns, shipping, sizing, FAQs — your assistant’s brain.</p>
          <Link href="/onboarding/knowledge" className="db-link">Edit →</Link>
        </div>
        <div className="db-tile">
          <h3>Widget & Links</h3>
          <p>Customize and install on your site or use Starter Link.</p>
          <Link href="/dashboard/widget" className="db-link">Manage →</Link>
        </div>
        <div className="db-tile">
          <h3>Billing</h3>
          <p>Plan, usage, and payment settings.</p>
          <Link href="/dashboard/billing" className="db-link">View →</Link>
        </div>
      </section>
    </div>
  );
}
// src/app/dashboard/page.tsx

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import SupportMetricsCards from './_components/SupportMetricsCards';
import DesignPartnerRolloutCard from './_components/DesignPartnerRolloutCard';
import CaseStudyExportCard from './_components/CaseStudyExportCard';
import MobilePageHeader from './_components/MobilePageHeader';

export default async function MerchantOverview() {
  const authed = await getAuthedUserAndTenant();
  if (!authed?.tenant?.id) redirect('/demo-login?autostart=1&next=/dashboard');

  const tenantId = authed.tenant.id;

  return (
    <div className="db-container">
      {/* Header – keep Cursor's version but tighten spacing */}
      <header className="db-header">
   <MobilePageHeader title="Overview" />

  <div>
    <h1 className="db-title">Overview</h1>
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

      <style>{`
  .db-mobilePageTop{
    display:none;
  }

.db-mobilePageTop .db-pageIconBtn{
  width:48px;
  height:48px;
  min-width:48px;
  min-height:48px;
  border-radius:14px;
  border:none;
  background:transparent;
  color:#111827;
  display:inline-flex;
  align-items:center;
  justify-content:flex-start;
  flex:0 0 48px;
  box-shadow:none;
  padding:0;
}

  .db-pageIconBtn--ghost{
    visibility:hidden;
  }

  @media (max-width: 1000px){
    .db-mobilePageTop{
      display:grid;
      grid-template-columns:40px 1fr 40px;
      align-items:center;
      gap:10px;
      position:sticky;
      top:0;
      z-index:10;
      background:#f8fafc;
      border-bottom:1px solid #e5e7eb;
      box-shadow:0 1px 0 rgba(15,23,42,.03);
      padding:8px 0 12px;
      margin-bottom:12px;
    }

    .db-mobilePageTitle{
      text-align:center;
      font-size:18px;
      font-weight:800;
      color:#111827;
    }

    .db-title{
      display:none;
    }

    .db-header{
      display:grid;
      gap:12px;
    }

    .db-actions{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
    }
  }
`}</style>
    </div>
  );
}
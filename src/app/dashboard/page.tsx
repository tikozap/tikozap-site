// src/app/dashboard/page.tsx

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import SupportMetricsCards from './_components/SupportMetricsCards';
import MobilePageHeader from './_components/MobilePageHeader';
import OverviewVisualDashboard from './_components/OverviewVisualDashboard';

export default async function MerchantOverview() {
  const authed = await getAuthedUserAndTenant();
  if (!authed?.tenant?.id) redirect('/login');

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
    <Link href="/dashboard/conversations" className="db-btn primary">Open Inbox</Link>
  </div>
</header>

      <section className="db-section">
        <OverviewVisualDashboard />
      </section>

      {/* Metrics – keep Cursor's card, but make full-width */}
      <section className="db-section db-metrics">
        <SupportMetricsCards />
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
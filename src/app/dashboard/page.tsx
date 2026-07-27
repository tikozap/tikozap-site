// src/app/dashboard/page.tsx

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthedUserAndTenant } from '@/lib/auth';
import SupportMetricsCards from './_components/SupportMetricsCards';
import MobilePageHeader from './_components/MobilePageHeader';
import OverviewVisualDashboard from './_components/OverviewVisualDashboard';

export default async function MerchantOverview() {
  const authed = await getAuthedUserAndTenant();
  if (!authed?.tenant?.id) redirect('/login');

  return (
    <div>
      <MobilePageHeader title="Overview" />

      <div className="db-top">
        <div>
          <h1 className="db-title">Overview</h1>
        </div>

        <Link href="/dashboard/conversations" className="db-btn primary">
          Open Inbox
        </Link>
      </div>

      <div className="db-pageStack">
        <section className="db-section">
          <OverviewVisualDashboard />
        </section>

        <section className="db-section db-metrics">
          <SupportMetricsCards />
        </section>
      </div>
    </div>
  );
}
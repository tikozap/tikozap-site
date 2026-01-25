// src/app/dashboard/layout.tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import './dashboard.css';

import { getAuthedUserAndTenant } from '@/lib/auth';
import DashboardShell from './_components/DashboardShell';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const authed = await getAuthedUserAndTenant();
  if (!authed) redirect('/login');

  // getAuthedUserAndTenant() may return different tenant shapes in TS, so be defensive:
  const t: any = authed.tenant as any;
  const tenantName = t?.storeName ?? t?.name ?? 'Your store';
  const tenantPlan = t?.plan ? String(t.plan) : 'Pro';

  return (
    <div className="db-wrap">
      <DashboardShell tenantName={tenantName} tenantPlan={tenantPlan}>
        {children}
      </DashboardShell>
    </div>
  );
}

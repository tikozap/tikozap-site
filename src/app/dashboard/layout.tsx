import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import './dashboard.css';
import DashboardShell from './_components/DashboardShell';
import { getAuthedUserAndTenant } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    redirect('/demo-login?autostart=1&next=/dashboard/conversations');
  }

  return (
    <div className="db-wrap">
      <DashboardShell tenantName={auth.tenant.storeName}>{children}</DashboardShell>
    </div>
  );
}

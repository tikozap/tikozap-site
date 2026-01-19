import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import './dashboard.css';

import { getAuthedUserAndTenant } from '@/lib/auth';
import DashboardShell from './_components/DashboardShell';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const authed = await getAuthedUserAndTenant();
  if (!authed) redirect('/login'); // (or /demo-login if you still want demo entry)

  return (
    <div className="db-wrap">
      <DashboardShell tenantName="Your store">{children}</DashboardShell>
    </div>
  );
}

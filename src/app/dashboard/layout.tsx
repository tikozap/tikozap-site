// src/app/dashboard/layout.tsx

import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import './dashboard.css';
import DashboardShell from './_components/DashboardShell';
import { getAuthedUserAndTenant } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    redirect('/login');
  }

  return (
    <div className="db-wrap">
      <DashboardShell
  tenantName={auth.tenant.storeName || "Your Store"}
  planName={auth.tenant.billingPlan|| "Starter"}
>
  {children}
</DashboardShell>

<style>{`
.db-mobilePageTop{
  display:none;
}

.db-pageIconBtn{
  width:40px;
  height:40px;
  border-radius:14px;
  border:1px solid #d1d5db;
  background:#fff;
  color:#111827;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  flex:0 0 40px;
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
}
`}</style>

    </div>
  );
}

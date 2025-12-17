import type { ReactNode } from 'react';
import './dashboard.css';
import DemoGate from '../_components/DemoGate';
import DashboardShell from './_components/DashboardShell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DemoGate requireLogin>
      <div className="db-wrap">
        <DashboardShell>{children}</DashboardShell>
      </div>
    </DemoGate>
  );
}

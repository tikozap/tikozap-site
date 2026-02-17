'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

function NavItem({ href, label, pill }: { href: string; label: string; pill?: string }) {
  const pathname = usePathname() || '';
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <li>
      <Link className={['db-link', active ? 'active' : ''].filter(Boolean).join(' ')} href={href}>
        <span>{label}</span>
        {pill ? <span className="db-pill">{pill}</span> : null}
      </Link>
    </li>
  );
}

export default function DashboardShell({
  children,
  tenantName,
}: {
  children: ReactNode;
  tenantName: string;
}) {

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      localStorage.removeItem('tz_demo_logged_in');
      localStorage.removeItem('tz_demo_onboarded');
      localStorage.removeItem('tz_demo_tenant_name');
      localStorage.removeItem('tz_demo_tenant_slug');
    } catch {}
    window.location.href = '/demo-login';
  };

  return (
    <div className="db-shell">
      <aside className="db-card db-sidebar">
        <div className="db-brand">
          <div>
            <div className="db-ws">{tenantName}</div>
            <div className="db-meta">Plan: Pro (demo)</div>
          </div>
          <button className="db-btn" onClick={signOut} title="Sign out (demo)">
            Sign out
          </button>
        </div>

        <ul className="db-nav">
          <NavItem href="/dashboard" label="Overview" />
          <NavItem href="/dashboard/conversations" label="Conversations" pill="Inbox" />
          <NavItem href="/dashboard/knowledge" label="Knowledge" />
          <NavItem href="/dashboard/widget" label="Widget" />
          <NavItem href="/dashboard/billing" label="Billing" />
          <NavItem href="/dashboard/settings" label="Settings" />
        </ul>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          Merchant-only area. (Platform admin comes later under <code>/admin</code>.)
        </div>
      </aside>

      <section className="db-card db-main">{children}</section>
    </div>
  );
}

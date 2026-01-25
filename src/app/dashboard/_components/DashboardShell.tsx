// src/app/dashboard/_components/DashboardShell.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

function NavItem({
  href,
  label,
  pill,
}: {
  href: string;
  label: string;
  pill?: string;
}) {
  const pathname = usePathname() || '';
  const active =
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <li>
      <Link
        className={['db-link', active ? 'active' : ''].filter(Boolean).join(' ')}
        href={href}
      >
        <span>{label}</span>
        {pill ? <span className="db-pill">{pill}</span> : null}
      </Link>
    </li>
  );
}

export default function DashboardShell({
  children,
  tenantName: tenantNameProp,
  tenantPlan = 'Pro',
}: {
  children: ReactNode;
  tenantName: string;
  tenantPlan?: string;
}) {
  const router = useRouter();
  const pathname = usePathname() || '';

  const [tenantName, setTenantName] = useState(tenantNameProp || 'Your store');
  const [navOpen, setNavOpen] = useState(false);

  // (B) track which pane is active on mobile (list vs thread)
  const [cxPane, setCxPane] = useState<'list' | 'thread'>('list');

  const isConversations = pathname.startsWith('/dashboard/conversations');

  const toggleConvoPane = () => {
    const w = window as unknown as { __tzToggleCxPane?: () => void };
    if (typeof w.__tzToggleCxPane === 'function') w.__tzToggleCxPane();
    else window.dispatchEvent(new Event('tz:cx:toggle-pane'));
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }

    // older Safari
    const legacyMq = mq as unknown as {
      addListener?: (cb: () => void) => void;
      removeListener?: (cb: () => void) => void;
    };
    legacyMq.addListener?.(onChange);
    return () => legacyMq.removeListener?.(onChange);
  }, []);

  useEffect(() => {
    setTenantName(tenantNameProp || 'Your store');
  }, [tenantNameProp]);

  useEffect(() => {
    // close drawer when navigating
    setNavOpen(false);
  }, [pathname]);

  // Listen for pane changes from ConversationsClient so we can flip the icon
  useEffect(() => {
    const onPane = (e: Event) => {
      const ce = e as CustomEvent<{ pane?: 'list' | 'thread' }>;
      const next = ce?.detail?.pane;
      if (next === 'list' || next === 'thread') setCxPane(next);
    };
    window.addEventListener('tz:cx:pane', onPane as EventListener);
    return () => window.removeEventListener('tz:cx:pane', onPane as EventListener);
  }, []);

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className={['db-shell', navOpen ? 'is-navOpen' : ''].join(' ')}>
      {/* Mobile topbar */}
      <header className="db-topbar">
        <button
          type="button"
          className="db-iconBtn"
          onClick={() => setNavOpen((v) => (isMobile ? !v : true))}
          aria-label={isMobile ? (navOpen ? 'Close menu' : 'Open menu') : 'Open menu'}
          title={isMobile ? (navOpen ? 'Close menu' : 'Open menu') : 'Menu'}
        >
          {isMobile ? (navOpen ? '<' : '>') : '☰'}
        </button>

        <div className="db-topbarTitle">{tenantName}</div>

        {isConversations ? (
          <button
            type="button"
            className="db-iconBtn"
            onClick={toggleConvoPane}
            aria-label={cxPane === 'list' ? 'Open thread' : 'Back to inbox'}
            title={cxPane === 'list' ? 'Open thread' : 'Back to inbox'}
          >
            {cxPane === 'list' ? '>' : '<'}
          </button>
        ) : (
          <button
            type="button"
            className="db-iconBtn"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
          >
            ⎋
          </button>
        )}
      </header>

      {/* Scrim (tap to close) */}
      <button
        type="button"
        className="db-scrim"
        aria-label="Close menu"
        onClick={() => setNavOpen(false)}
      />

      <div className="db-body">
        <aside className="db-card db-sidebar">
          <div className="db-brand">
            <div>
              <div className="db-ws">{tenantName}</div>
              <div className="db-meta">Plan: {tenantPlan}</div>
            </div>
          </div>

          <ul className="db-nav">
<NavItem href="/dashboard" label="Overview" />
<NavItem href="/dashboard/conversations" label="Conversations" pill="Inbox" />

{/* Milestone 4 */}
<NavItem href="/dashboard/link" label="TikoZap Link" pill="No Website Needed" />

<NavItem href="/dashboard/knowledge" label="Knowledge" />
<NavItem href="/dashboard/widget" label="Widget" />
<NavItem href="/dashboard/billing" label="Billing" />
<NavItem href="/dashboard/settings" label="Settings" />
          </ul>

          <div className="db-sidebar-footer">
            <button className="db-btn" onClick={signOut} title="Sign out">
              Sign out
            </button>

            <div className="db-sidebar-note">
              Merchant-only area. (Platform admin comes later under <code>/admin</code>.)
            </div>
          </div>
        </aside>

        <section className="db-card db-main">{children}</section>
      </div>
    </div>
  );
}

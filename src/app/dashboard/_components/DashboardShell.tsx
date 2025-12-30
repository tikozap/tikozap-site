'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const KEY_TENANT_NAME = 'tz_demo_tenant_name';
const KEY_LOGIN = 'tz_demo_logged_in';
const KEY_ONBOARDED = 'tz_demo_onboarded';
const KEY_TENANT_SLUG = 'tz_demo_tenant_slug';

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

export default function DashboardShell({ children }: { children: ReactNode }) {
  // ✅ ALL hooks must be inside this function (and above return)
  const pathname = usePathname() || '';

  const [tenantName, setTenantName] = useState('Three Tree Fashion');
  const [navOpen, setNavOpen] = useState(false);

  // (B) track which pane is active on mobile (list vs thread)
  const [cxPane, setCxPane] = useState<'list' | 'thread'>('list');

  const isConversations = pathname.startsWith('/dashboard/conversations');

  const toggleConvoPane = () => {
    // Prefer direct function if you attached it in ConversationsClient
    const fn = (window as any).__tzToggleCxPane;
    if (typeof fn === 'function') fn();
    // Fallback for the event-based version
    else window.dispatchEvent(new Event('tz:cx:toggle-pane'));
  };

  useEffect(() => {
    const name = localStorage.getItem(KEY_TENANT_NAME);
    if (name) setTenantName(name);
  }, []);

  useEffect(() => {
    // close drawer when navigating
    setNavOpen(false);
  }, [pathname]);

  // Listen for pane changes from ConversationsClient so we can flip the icon
  useEffect(() => {
    const onPane = (e: any) => {
      const next = e?.detail?.pane;
      if (next === 'list' || next === 'thread') setCxPane(next);
    };
    window.addEventListener('tz:cx:pane', onPane);
    return () => window.removeEventListener('tz:cx:pane', onPane);
  }, []);

  const signOut = () => {
    localStorage.removeItem(KEY_LOGIN);
    localStorage.removeItem(KEY_ONBOARDED);
    localStorage.removeItem(KEY_TENANT_NAME);
    localStorage.removeItem(KEY_TENANT_SLUG);
    window.location.href = '/demo-login';
  };

  return (
    <div className={['db-shell', navOpen ? 'is-navOpen' : ''].join(' ')}>
      {/* Mobile topbar */}
      <header className="db-topbar">
        <button
          type="button"
          className="db-iconBtn"
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          title="Menu"
        >
          ☰
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
            {cxPane === 'list' ? '›' : '‹'}
          </button>
        ) : (
          <button
            type="button"
            className="db-iconBtn"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out (demo)"
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
              <div className="db-meta">Plan: Pro (demo)</div>
            </div>
          </div>

          <ul className="db-nav">
            <NavItem href="/dashboard" label="Overview" />
            <NavItem href="/dashboard/conversations" label="Conversations" pill="Inbox" />
            <NavItem href="/dashboard/knowledge" label="Knowledge" />
            <NavItem href="/dashboard/widget" label="Widget" />
            <NavItem href="/dashboard/billing" label="Billing" />
            <NavItem href="/dashboard/settings" label="Settings" />
          </ul>

          <div className="db-sidebar-footer">
            <button className="db-btn" onClick={signOut} title="Sign out (demo)">
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

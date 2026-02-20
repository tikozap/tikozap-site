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
  tenantName,
}: {
  children: ReactNode;
  tenantName: string;
}) {
  const router = useRouter();
  const pathname = usePathname() || '';

  const [navOpen, setNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isConversations = pathname.startsWith('/dashboard/conversations');

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

  // Close drawer when navigating
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  const signOut = async () => {
    // If your project uses a different logout route, change it here.
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className={['db-shell', navOpen ? 'is-navOpen' : ''].filter(Boolean).join(' ')}>
      {/* Mobile topbar */}
      <header className="db-topbar">
        <button
          type="button"
          className="db-iconBtn"
          onClick={() => setNavOpen((v) => (isMobile ? !v : true))}
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
          title={navOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobile ? (navOpen ? '<' : '>') : '☰'}
        </button>

        <div className="db-topbarTitle">{tenantName}</div>

        {/* Right button */}
        <button
          type="button"
          className="db-iconBtn"
          onClick={signOut}
          aria-label="Sign out"
          title="Sign out"
        >
          ⎋
        </button>
      </header>

      {/* Scrim for mobile */}
      <button
        type="button"
        className="db-scrim"
        aria-label="Close menu"
        onClick={() => setNavOpen(false)}
      />

      <div className="db-body">
        {/* Sidebar */}
        <aside className="db-sidebar">
          <div className="db-brand">
            <div className="db-ws">{tenantName}</div>
            <div className="db-meta">Plan: PRO</div>
          </div>

          <ul className="db-nav">
            <NavItem href="/dashboard" label="Overview" />
            <NavItem href="/dashboard/conversations" label="Conversations" pill="Inbox" />
            <NavItem href="/dashboard/phone-agent" label="Phone Agent" />
            <NavItem href="/dashboard/tikozap-link" label="TikoZap Link" />
            <NavItem href="/dashboard/knowledge" label="Knowledge" />
            <NavItem href="/dashboard/widget" label="Widget" />
            <NavItem href="/dashboard/billing" label="Billing" />
            <NavItem href="/dashboard/settings" label="Settings" />
          </ul>

          <div className="db-sidebar-footer">
            <button type="button" className="db-btn" onClick={signOut} title="Sign out">
              Sign out
            </button>

            <div className="db-sidebar-note">
              Merchant-only area. (Platform admin comes later under <code>/admin</code>.)
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="db-main">{children}</main>
      </div>
    </div>
  );
}

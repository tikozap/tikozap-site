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

  useEffect(() => {
  const onToggle = () => setNavOpen((v) => !v);
  window.addEventListener('tz-dashboard-toggle-nav', onToggle as EventListener);
  return () => {
    window.removeEventListener('tz-dashboard-toggle-nav', onToggle as EventListener);
  };
}, []);

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
  if (!isMobile) {
    setNavOpen(false);
  }
}, [isMobile]);

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
    <div
  className={[
    'db-shell',
    navOpen ? 'is-navOpen' : '',
  ].filter(Boolean).join(' ')}
>

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
            <button
  type="button"
  className="db-link"
  onClick={signOut}
  title="Log out"
>
  <span>Log out</span>
</button>

            <div className="db-sidebar-note">
              Merchant-only area. (Platform admin comes later under <code>/admin</code>.)
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="db-main">{children}</main>
      </div>
  <style jsx global>{`
  .db-shell {
  height: 100svh;
  min-height: 100svh;
  background: #f8fafc;
  color: #111827;
  overflow: hidden;
}

.db-body {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  height: 100svh;
  min-height: 100svh;
  overflow: hidden;
}

.db-main {
  min-width: 0;
  height: 100svh;
  min-height: 100svh;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
}

  .db-sidebar {
    position: relative;
    top: auto;
    left: auto;
    bottom: auto;
    width: auto;
    transform: none;
    box-shadow: none;
    border-right: 1px solid #e5e7eb;
    background: #f3f4f6;
    padding: 14px 10px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow: hidden;
  }

  .db-brand {
    display: grid;
    gap: 4px;
  }

  .db-ws {
    font-size: 14px;
    font-weight: 800;
    color: #111827;
  }

  .db-meta {
    font-size: 12px;
    color: #6b7280;
  }

  .db-nav {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 6px;
  }

  .db-link,
  .db-link:visited,
  .db-link:active {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 14px;
    color: #4b5563 !important;
    text-decoration: none !important;
    background: transparent;
    font-weight: 500;
  }

  .db-link:hover {
    background: #e5e7eb;
    color: #111827 !important;
    text-decoration: none !important;
  }

  .db-link.active {
    background: #e5e7eb;
    color: #111827 !important;
    font-weight: 700;
    border: 1px solid #d1d5db;
  }

  .db-pill {
    background: #e5e7eb;
    color: #4b5563 !important;
    border: 1px solid #d1d5db;
  }

  .db-sidebar-footer {
    margin-top: auto;
    display: grid;
    gap: 12px;
    justify-items: start;
  }

  .db-sidebar-note {
    font-size: 12px;
    line-height: 1.5;
    color: #6b7280;
  }

  .db-scrim {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgba(15, 23, 42, 0.24);
    border: 0;
    padding: 0;
    display: none;
  }

  @media (max-width: 900px) {
    .db-body {
  grid-template-columns: 1fr;
  height: 100svh;
  min-height: 100svh;
  overflow: hidden;
}

.db-main {
  height: 100svh;
  min-height: 100svh;
  padding: 12px 0;
  overflow-y: auto;
  overflow-x: hidden;
}

    .db-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: min(220px, 78vw);
      z-index: 70;
      transform: translateX(-100%);
      transition: transform 0.2s ease;
      box-shadow: 8px 0 24px rgba(15, 23, 42, 0.12);
      border-right: 1px solid #e5e7eb;
      background: #f3f4f6;
      padding: 14px 10px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .db-shell.is-navOpen .db-sidebar {
      transform: translateX(0);
    }

    .db-shell.is-navOpen .db-scrim {
      display: block;
    }
.db-container{
  min-height: 0;
}
  }
`}</style>
    </div>
  );
}

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
  nested = false,
}: {
  href: string;
  label: string;
  pill?: string;
  nested?: boolean;
}) {
  const pathname = usePathname() || '';

  const active =
    pathname === href ||
    (href !== '/dashboard' && pathname.startsWith(`${href}/`));

  return (
    <li>
      <Link
        className={[
          'db-link',
          nested ? 'db-subLink' : '',
          active ? 'active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        href={href}
      >
        <span>{label}</span>
        {pill ? <span className="db-pill">{pill}</span> : null}
      </Link>
    </li>
  );
}

function AssistantNav() {
  const pathname = usePathname() || '';
  const assistantActive = pathname.startsWith('/dashboard/assistant');

  const [open, setOpen] = useState(assistantActive);

  useEffect(() => {
    if (assistantActive) {
      setOpen(true);
    }
  }, [assistantActive]);

  return (
    <li className="db-navGroup">
      <div
        className={[
          'db-assistantRow',
          assistantActive ? 'active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Link href="/dashboard/assistant" className="db-assistantMain">
          Assistant
        </Link>

        <button
          type="button"
          className="db-assistantToggle"
          aria-label={open ? 'Collapse Assistant menu' : 'Expand Assistant menu'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={open ? 'is-open' : ''}
          >
            <path
              d="M7 10l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {open ? (
        <ul className="db-subNav">
          <NavItem
            href="/dashboard/assistant/identity"
            label="Identity"
            nested
          />
<NavItem
  href="/dashboard/assistant/practice"
  label="Test & Coach"
  nested
/>

          <NavItem
            href="/dashboard/assistant/memory"
            label="Memory"
            nested
          />
        </ul>
      ) : null}
    </li>
  );
}

export default function DashboardShell({
  children,
  tenantName,
  planName,
  role,
}: {
  children: ReactNode;
  tenantName: string;
  planName: string;
  role: 'owner' | 'staff';
}) {
  const router = useRouter();
  const pathname = usePathname() || '';

  const isOwner = role === 'owner';

  const [navOpen, setNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onToggle = () => setNavOpen((value) => !value);

    window.addEventListener(
      'tz-dashboard-toggle-nav',
      onToggle as EventListener,
    );

    return () => {
      window.removeEventListener(
        'tz-dashboard-toggle-nav',
        onToggle as EventListener,
      );
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

    const legacyMq = mq as unknown as {
      addListener?: (callback: () => void) => void;
      removeListener?: (callback: () => void) => void;
    };

    legacyMq.addListener?.(onChange);

    return () => legacyMq.removeListener?.(onChange);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setNavOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

    router.replace('/login');
    router.refresh();
  };

  return (
    <div
      className={[
        'db-shell',
        navOpen ? 'is-navOpen' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className="db-scrim"
        aria-label="Close menu"
        onClick={() => setNavOpen(false)}
      />

      <div className="db-body">
        <aside className="db-sidebar">
          <div className="db-brand">
            <div className="db-ws">{tenantName}</div>

            <div className="db-meta">
              Plan: {planName === 'pro' ? 'Pro Trial' : planName}
            </div>
          </div>

          <ul className="db-nav">
            <NavItem href="/dashboard" label="Overview" />

            <NavItem
              href="/dashboard/conversations"
              label="Inbox"
            />

            <AssistantNav />

            <NavItem
              href="/dashboard/knowledge"
              label="Knowledge"
            />

            <NavItem
              href="/dashboard/phone-agent"
              label="Phone Agent"
            />

            <NavItem
              href="/dashboard/tikozap-link"
              label="Starter Link"
            />

            <NavItem
              href="/dashboard/widget"
              label="Widget"
            />

{isOwner ? (
  <NavItem
    href="/dashboard/billing"
    label="Billing"
  />
) : null}

            <NavItem
              href="/dashboard/settings"
              label="Settings"
            />
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
              Merchant-only area
            </div>
          </div>
        </aside>

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

        .db-navGroup {
          display: grid;
          gap: 4px;
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

        .db-assistantRow {
          min-height: 42px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 38px;
          align-items: stretch;
          border-radius: 14px;
          color: #4b5563;
          overflow: hidden;
        }

        .db-assistantRow:hover {
          background: #e5e7eb;
          color: #111827;
        }

        .db-assistantRow.active {
          background: #e5e7eb;
          color: #111827;
          border: 1px solid #d1d5db;
          font-weight: 600;
        }

        .db-assistantMain {
          min-width: 0;
          display: flex;
          align-items: center;
          padding: 10px 0 10px 12px;
          color: inherit !important;
          text-decoration: none !important;
          font-size: 13px;
          font-weight: 500;
        }

        .db-assistantToggle {
          width: 38px;
          border: 0;
          padding: 0;
          background: transparent;
          color: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .db-assistantToggle:hover {
          background: rgba(17, 24, 39, 0.06);
        }

        .db-assistantToggle svg {
          transition: transform 0.18s ease;
        }

        .db-assistantToggle svg.is-open {
          transform: rotate(180deg);
        }

        .db-subNav {
          list-style: none;
          margin: 0;
          padding: 0 0 0 12px;
          display: grid;
          gap: 2px;
        }

        .db-subLink,
        .db-subLink:visited,
        .db-subLink:active {
          min-height: 34px;
          padding: 7px 12px;
          border-radius: 11px;
          color: #6b7280 !important;
          font-size: 13px;
          font-weight: 500;
        }

        .db-subLink:hover {
          background: #e5e7eb;
          color: #111827 !important;
        }

.db-subLink.active {
  background: #eef2f7;
  border: 1px solid transparent;
  color: #111827 !important;
  font-weight: 600;
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

          .db-container {
            min-height: 0;
          }
        }
      `}</style>
    </div>
  );
}
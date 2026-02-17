'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href ? 'nav__link nav__link--active' : 'nav__link';

  return (
    <header className="nav-shell">
      {/* Full-width strip */}
      <nav className="nav">
        {/* Centered content – same width as hero, etc. */}
        <div className="container nav__inner">
          {/* Brand: logo + wordmark */}
          <Link href="/" className="nav__brand" aria-label="TikoZap home">
            <Image
              src="/tikozaplogo.svg"
              alt="TikoZap"
              className="nav__logo-img"
              width={128}
              height={32}
              style={{ height: '2rem', width: 'auto' }} // bigger logo
              priority
            />
            <span
              className="nav__logo-text"
              style={{ fontSize: '1.5rem', fontWeight: 700 }} // bigger wordmark
            >
              TikoZap
            </span>
          </Link>

          {/* Desktop links */}
          <div className="nav__links">
            {LINKS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href)}
                  style={{ color: active ? '#111827' : '#6B7280' }} // dark when active, grey otherwise
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/login"
              className="nav__login nav__login--desktop"
              style={{ color: '#6B7280' }} // grey Log in
            >
              Log in
            </Link>
          </div>

          {/* Right side on mobile: Log in + hamburger */}
          <div className="nav__right">
            <Link
              href="/login"
              className="nav__login nav__login--mobile"
              style={{ color: '#6B7280' }} // grey Log in
            >
              Log in
            </Link>
            <button
              type="button"
              className="nav__toggle"
              aria-expanded={open}
              aria-label="Toggle navigation"
              onClick={() => setOpen((v) => !v)}
              style={{ width: 32, height: 32 }} // slightly smaller button
            >
              <span
                className="nav__toggle-bar"
                style={{ width: '0.7rem', height: 2, backgroundColor: '#6B7280' }}
              />
              <span
                className="nav__toggle-bar"
                style={{ width: '0.7rem', height: 2, backgroundColor: '#6B7280' }}
              />
              <span
                className="nav__toggle-bar"
                style={{ width: '0.7rem', height: 2, backgroundColor: '#6B7280' }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown overlay */}
      {open && (
        <div className="nav__overlay" aria-label="Mobile navigation">
          <div className="nav__menu">
            {LINKS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav__menu-item"
                  style={{ color: active ? '#111827' : '#6B7280' }} // grey, darker when active
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .nav-shell {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 40;
          background: var(--bg-gray, #f9fafb); /* full-width gray band */
          border-bottom: none;
          box-shadow: none;
        }

        /* Keep content from hiding behind fixed nav */
        :global(main) {
          padding-top: 4.5rem; /* space for taller nav */
        }

        /* Remove bottom border line */
        .nav {
          border-bottom: none;
          box-shadow: none;
        }

        /* Inner row: centered, same width as other sections */
        .nav__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 4rem;
        }

        /* Brand base layout */
        a.nav__brand {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
        }

        a.nav__brand:hover {
          text-decoration: none;
        }

        /* Desktop links */
        .nav__links {
          display: none;
          align-items: center;
          gap: 1.5rem;
        }

        .nav__link {
          font-size: 0.92rem;
          text-decoration: none;
        }

        .nav__link--active {
          font-weight: 500;
        }

        .nav__login {
          font-size: 0.92rem;
          text-decoration: none;
        }

        .nav__right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav__login--desktop {
          display: none;
        }

        .nav__login--mobile {
          display: inline-block;
        }

        /* Hamburger button base */
        .nav__toggle {
          display: inline-flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.25rem;
          border-radius: 800px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .nav__toggle-bar {
          border-radius: 999px;
        }

        /* Mobile dropdown */
        .nav__overlay {
          position: absolute;
          top: 3.5rem;
          right: 0;
          left: 0;
          z-index: 35;
          display: flex;
          justify-content: flex-end;
          padding-right: 0.75rem;
          pointer-events: none;
        }

        .nav__menu {
          pointer-events: auto;
          width: 5rem; /* narrow menu */
          border-radius: 1rem;
          background: #ffffff;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
          padding: 0.3rem 0.2rem;
          display: flex;
          flex-direction: column;
        }

        .nav__menu-item {
          padding: 0.55rem 0.9rem;
          font-size: 0.94rem;
          text-decoration: none;
        }

        .nav__menu-item:hover {
          background: #f3f4f6;
        }

        /* Desktop breakpoint */
        @media (min-width: 768px) {
          .nav__inner {
            height: 4.25rem;
          }

          .nav__links {
            display: inline-flex;
          }

          .nav__right {
            display: none;
          }

          .nav__login--desktop {
            display: inline-block;
          }

          .nav__overlay {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}

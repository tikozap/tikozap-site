// src/components/Nav.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

const MARKETING_ORIGIN = 'https://tikozap.com';
const APP_ORIGIN = 'https://app.tikozap.com';

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

  // ✅ True only in the browser, when running on app.tikozap.com
  const onAppHost = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'app.tikozap.com';
  }, []);

  // ✅ On app host, marketing links must be absolute to tikozap.com
  const marketingHref = (path: string) => (onAppHost ? `${MARKETING_ORIGIN}${path}` : path);

  // ✅ On marketing host, login should go to app host. On app host, keep /login.
  const loginHref = onAppHost ? '/login' : `${APP_ORIGIN}/login`;

  // ✅ Logo/Home: on app host, clicking should go to marketing home
  const homeHref = onAppHost ? `${MARKETING_ORIGIN}/` : '/';

  const isActive = (href: string) =>
    pathname === href ? 'nav__link nav__link--active' : 'nav__link';

  return (
    <header className="nav-shell">
      <nav className="nav">
        <div className="container nav__inner">
          {/* ✅ Brand: use <a> so cross-origin navigation is guaranteed */}
          <a href={homeHref} className="nav__brand" aria-label="TikoZap home">
            <img
              src="/tikozaplogo.svg"
              alt="TikoZap"
              className="nav__logo-img"
              style={{ height: '2rem', width: 'auto' }}
            />
            <span className="nav__logo-text" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              TikoZap
            </span>
          </a>

          {/* Desktop links */}
          <div className="nav__links">
            {LINKS.map((item) => {
              const active = pathname === item.href;
              const href = marketingHref(item.href);

              // ✅ If on app host, use <a> (absolute, cross-origin)
              return onAppHost ? (
                <a
                  key={item.href}
                  href={href}
                  className={isActive(item.href)}
                  style={{ color: active ? '#111827' : '#6B7280' }}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={href}
                  className={isActive(item.href)}
                  style={{ color: active ? '#111827' : '#6B7280' }}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Log in */}
            {onAppHost ? (
              <Link href={loginHref} className="nav__login nav__login--desktop" style={{ color: '#6B7280' }}>
                Log in
              </Link>
            ) : (
              <a href={loginHref} className="nav__login nav__login--desktop" style={{ color: '#6B7280' }}>
                Log in
              </a>
            )}
          </div>

          {/* Mobile right */}
          <div className="nav__right">
            {onAppHost ? (
              <Link href={loginHref} className="nav__login nav__login--mobile" style={{ color: '#6B7280' }}>
                Log in
              </Link>
            ) : (
              <a href={loginHref} className="nav__login nav__login--mobile" style={{ color: '#6B7280' }}>
                Log in
              </a>
            )}

            <button
              type="button"
              className="nav__toggle"
              aria-expanded={open}
              aria-label="Toggle navigation"
              onClick={() => setOpen((v) => !v)}
              style={{ width: 32, height: 32 }}
            >
              <span className="nav__toggle-bar" style={{ width: '0.7rem', height: 2, backgroundColor: '#6B7280' }} />
              <span className="nav__toggle-bar" style={{ width: '0.7rem', height: 2, backgroundColor: '#6B7280' }} />
              <span className="nav__toggle-bar" style={{ width: '0.7rem', height: 2, backgroundColor: '#6B7280' }} />
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div className="nav__overlay" aria-label="Mobile navigation">
          <div className="nav__menu">
            {LINKS.map((item) => {
              const href = marketingHref(item.href);
              return onAppHost ? (
                <a key={item.href} href={href} className="nav__menu-item" style={{ color: '#6B7280' }}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} href={href} className="nav__menu-item" style={{ color: '#6B7280' }}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ✅ Keep your existing <style jsx> block exactly as-is below this line */}
      {/* ... */}
    </header>
  );
}

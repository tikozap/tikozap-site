'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const is = (p: string) => (pathname === p ? { 'aria-current': 'page' as const } : {});

  return (
    <nav className="nav">
      <div className="container nav__inner">
        <Link href="/" className="nav__brand">TikoZap</Link>

        <button
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen(o => !o)}
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div id="primary-nav" className={`nav__links ${open ? 'is-open' : ''}`}>
          <Link href="/features" {...is('/features')}>Features</Link>
          <Link href="/pricing" {...is('/pricing')}>Pricing</Link>
          <Link href="/docs" {...is('/docs')}>Docs</Link>
          <Link href="/contact" className="button">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}


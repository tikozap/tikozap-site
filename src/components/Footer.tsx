// src/components/Footer.tsx

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Footer() {
  const pathname = usePathname();
  const [host, setHost] = useState('');

  useEffect(() => {
    setHost(window.location.hostname);
  }, []);

  const isStarterLinkHost =
    host.endsWith('.link.tikozap.com') ||
    host.endsWith('.link.localhost');

  // Hide footer on dashboard, demo, and Starter Link routes.
  if (
    pathname &&
    (pathname.startsWith('/demo') ||
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/l/') ||
      isStarterLinkHost)
  ) {
    return null;
  }

  return (
    <footer className="footer footer-band-navy">
      <div className="container-xl footer__inner">
        <div className="cols">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__brand-row">
              <Image
                src="/tikozaplogo.svg"
                alt="TikoZap"
                className="footer__brand-logo"
                width={128}
                height={32}
              />

              <span className="footer__brand-name">TikoZap</span>
            </div>

            <p className="footer__brand-copy">
              Hire an AI employee for your business — with your team always in
              control.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3>Product</h3>

            <ul className="footer__list">
              <li>
                <Link href="/features">Product</Link>
              </li>

              <li>
                <Link href="/pricing">Pricing</Link>
              </li>

              <li>
                <Link href="/docs">Help Center</Link>
              </li>
            </ul>
          </div>

          {/* Use cases */}
          <div>
            <h3>Use cases</h3>

            <ul className="footer__list">
<li>
  <Link href="/use-cases#ecommerce">
    E-commerce stores
  </Link>
</li>

<li>
  <Link href="/use-cases#shopify">
    Shopify widgets
  </Link>
</li>

<li>
  <Link href="/use-cases#starter-link">
    Starter Link
  </Link>
</li>

<li>
  <Link href="/use-cases#customer-support">
    AI customer support
  </Link>
</li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3>Company</h3>

            <ul className="footer__list">
              <li>
                <Link href="/about">About</Link>
              </li>

              <li>
                <Link href="/contact">Contact</Link>
              </li>

              <li>
                <Link href="/docs/privacy">Privacy</Link>
              </li>

              <li>
                <Link href="/docs/terms">Terms</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom-row">
          <small>© 2025 Ala Moda Innovations LLC · TikoZap</small>

          <small>Built for secure, human-guided AI employees.</small>
        </div>
      </div>
    </footer>
  );
}
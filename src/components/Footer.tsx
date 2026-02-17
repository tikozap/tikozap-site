'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on the live demo page so the chat has more room,
  // both on /demo and any nested demo routes.
  if (pathname && pathname.startsWith('/demo')) {
    return null;
  }

  return (
    <footer className="footer footer-band-navy">
      <div className="container footer__inner">
        <div className="cols">
          {/* Brand column */}
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
              Instant AI customer support for your store – with humans always in
              control.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h3>Product</h3>
            <ul className="footer__list">
              <li>
                <Link href="/features">Features</Link>
              </li>
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/docs">Docs</Link>
              </li>
            </ul>
          </div>

          {/* Use cases */}
          <div>
            <h3>Use cases</h3>
            <ul className="footer__list">
              <li>
                <Link href="/#how-it-works">E-commerce stores</Link>
              </li>
              <li>
                <Link href="/#how-it-works">Shopify widgets</Link>
              </li>
              <li>
                <Link href="/#how-it-works">Support teams</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3>Company</h3>
            <ul className="footer__list">
              <li>
                <a href="mailto:support@tikozap.com">Contact</a>
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
          <small>Built for secure, human-in-the-loop support.</small>
        </div>
      </div>
    </footer>
  );
}

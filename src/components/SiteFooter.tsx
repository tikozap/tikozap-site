// src/components/SiteFooter.tsx

import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="site-footer-brand">
          <div className="site-footer-logoRow">
            <img src="/logo-mark.png" alt="TikoZap" className="site-footer-logo" />
            <span className="site-footer-brandName">TikoZap NEW FOOTER TEST</span>
          </div>

          <p className="site-footer-text">
            AI customer support and sales automation for online stores.
          </p>

          <p className="site-footer-text site-footer-legalEntity">
            TikoZap is a product of <strong>Ala Moda Innovations LLC</strong>.
          </p>

          <p className="site-footer-text">
            Contact:{" "}
            <a href="mailto:support@tikozap.com" className="site-footer-link">
              support@tikozap.com
            </a>
          </p>
        </div>

        <div className="site-footer-col">
          <h3 className="site-footer-heading">Product</h3>
          <ul className="site-footer-list">
            <li><Link href="/features" className="site-footer-link">Features</Link></li>
            <li><Link href="/pricing" className="site-footer-link">Pricing</Link></li>
            <li><Link href="/docs" className="site-footer-link">Docs</Link></li>
            <li><Link href="/signup" className="site-footer-link">Start free trial</Link></li>
          </ul>
        </div>

        <div className="site-footer-col">
          <h3 className="site-footer-heading">Company</h3>
          <ul className="site-footer-list">
            <li><Link href="/about" className="site-footer-link">About</Link></li>
            <li><Link href="/contact" className="site-footer-link">Contact</Link></li>
            <li><Link href="/privacy" className="site-footer-link">Privacy</Link></li>
            <li><Link href="/terms" className="site-footer-link">Terms</Link></li>
          </ul>
        </div>
      </div>

      <div className="container site-footer-bottom">
        <p>© 2026 Ala Moda Innovations LLC. All rights reserved.</p>
        <p>Built to support online stores.</p>
      </div>
    </footer>
  );
}
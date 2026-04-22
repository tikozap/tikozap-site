// src/app/dashboard/tikozap-link/page.tsx

import Link from 'next/link';
import MobilePageHeader from '../_components/MobilePageHeader';

export default function TikoZapLinkPage() {
  return (
    <div className="db-container">
      <MobilePageHeader title="TikoZap Link" />

      <div className="db-pageStack">
        <h1 className="db-title">TikoZap Link</h1>
        <p className="db-sub">
          Manage your Starter Link storefront for customers who shop and chat from one simple link.
        </p>

        <div className="db-card">
          <div className="db-cardTitle">Starter Link setup</div>
          <p className="db-cardText">
            Set your public slug, preview your customer page, and open inbox conversations from one place.
          </p>

          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="db-btn primary" href="/onboarding/install">
              Open Starter Link setup
            </Link>
            <Link className="db-btn" href="/dashboard/conversations">
              Open inbox
            </Link>
            <Link className="db-btn" href="/l/demo" target="_blank">
              Preview public page
            </Link>
          </div>
        </div>

        <div className="db-card">
          <div className="db-cardTitle">Branding</div>
          <p className="db-cardText">
            Customers should feel this is your page, not a generic app page.
          </p>

          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Store logo</span>
              <input className="db-btn" type="text" placeholder="Logo URL or upload later" />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Store name</span>
              <input className="db-btn" type="text" placeholder="Demo Boutique" />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Tagline</span>
              <input className="db-btn" type="text" placeholder="Shop smarter with AI assistance" />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Subheading</span>
              <textarea
                className="db-btn"
                placeholder="Tell customers what makes your store special."
                style={{ minHeight: 88, paddingTop: 10, paddingBottom: 10, resize: 'vertical' }}
              />
            </label>
          </div>
        </div>

        <div className="db-card">
          <div className="db-cardTitle">Assistant</div>
          <p className="db-cardText">
            Give your storefront assistant a name that feels natural for your brand.
          </p>

          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Assistant name</span>
              <input className="db-btn" type="text" placeholder="Demo Boutique Assistant" />
            </label>
          </div>
        </div>

        <div className="db-card">
          <div className="db-cardTitle">Footer</div>
          <p className="db-cardText">
            Keep the page customer-friendly while making your store identity clear.
          </p>

          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Footer line</span>
              <input className="db-btn" type="text" placeholder="Demo Boutique powered by TikoZap" />
            </label>
          </div>
        </div>

        <div className="db-card">
          <div className="db-cardTitle">Public page controls</div>
          <p className="db-cardText">
            Choose what customers see in the Starter Link page header and menu.
          </p>

          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" />
              <span style={{ fontSize: 14, color: '#111827' }}>Show merchant login</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" defaultChecked />
              <span style={{ fontSize: 14, color: '#111827' }}>Show chat bubble</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" defaultChecked />
              <span style={{ fontSize: 14, color: '#111827' }}>Show footer branding</span>
            </label>
          </div>
        </div>

        <div className="db-card">
          <div className="db-cardTitle">Share</div>
          <p className="db-cardText">
            Use your Starter Link in bio, DMs, QR codes, and message follow-ups.
          </p>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                padding: '10px 12px',
                background: '#f8fafc',
                fontSize: 14,
                color: '#111827',
              }}
            >
              tikozap.com/l/demo
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="db-btn" type="button">Copy link</button>
              <button className="db-btn" type="button">Copy bio text</button>
              <button className="db-btn" type="button">Copy QR text</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// src/app/dashboard/phone-agent/page.tsx

import MobilePageHeader from '../_components/MobilePageHeader';

export default function PhoneAgentPage() {
return (
  <div className="db-container">
    <div className="db-pageStack">
      <MobilePageHeader title="Phone Agent" />

        <h1 className="db-title">Phone Agent</h1>

        <p className="db-sub">
          AI phone answering service for your business.
        </p>

        <div className="db-card">
          <div className="db-cardTitle">Early access</div>

          <p className="db-cardText">
            TikoZap Phone Agent will answer phone calls and speak naturally for:
          </p>

          <ul className="db-list">
            <li>Order status</li>
            <li>Shipping questions</li>
            <li>Returns</li>
            <li>Product recommendations</li>
            <li>Human handoff</li>
          </ul>

          <p className="db-cardText" style={{ marginTop: 14 }}>
            We’re currently enabling Phone Agent selectively for early partners while we finalize voice workflows and onboarding.
          </p>

          <a
            className="db-btn primary"
            href="mailto:support@tikozap.com"
            style={{ marginTop: 14, display: 'inline-flex' }}
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
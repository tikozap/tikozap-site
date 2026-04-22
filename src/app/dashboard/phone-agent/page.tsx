// src/app/dashboard/phone-agent/page.tsx

import Link from 'next/link';
import MobilePageHeader from '../_components/MobilePageHeader';

export default function PhoneAgentPage() {
  return (
    <div className="db-container">
      <MobilePageHeader title="Phone Agent" />

      <div className="db-pageStack">
        <h1 className="db-title">Phone Agent</h1>
        <p className="db-sub">
          Voice support lives in your Inbox workflow so staff and AI can hand off cleanly.
        </p>

        <div className="db-card">
          <div className="db-cardTitle">Quick actions</div>
          <p className="db-cardText">
            Open phone-originated conversations, monitor Twilio transport quality, and take over when
            needed.
          </p>

          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="db-btn primary" href="/dashboard/conversations">
              Open conversations
            </Link>
            <Link className="db-btn" href="/dashboard">
              View transport snapshot
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
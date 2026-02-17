import Link from 'next/link';

export default function PhoneAgentPage() {
  return (
    <div>
      <h1 className="db-title">Phone Agent</h1>
      <p className="db-sub">
        Voice support lives in your Inbox workflow so staff and AI can hand off cleanly.
      </p>

      <div
        style={{
          marginTop: 14,
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 14,
          background: '#fff',
        }}
      >
        <div style={{ fontWeight: 800 }}>Quick actions</div>
        <p style={{ marginTop: 6, opacity: 0.8 }}>
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
  );
}

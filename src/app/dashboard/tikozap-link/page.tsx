import Link from 'next/link';

export default function TikoZapLinkPage() {
  return (
    <div>
      <h1 className="db-title">TikoZap Link</h1>
      <p className="db-sub">
        Manage your Starter Link settings and copy-ready templates for bio, marketplace DM, and QR
        sharing.
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
        <div style={{ fontWeight: 800 }}>Starter Link setup</div>
        <p style={{ marginTop: 6, opacity: 0.8 }}>
          Configure slug/enabled state, then use onboarding templates to publish quickly across
          channels.
        </p>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="db-btn primary" href="/onboarding/install">
            Open Starter Link setup
          </Link>
          <Link className="db-btn" href="/dashboard/conversations">
            Open inbox
          </Link>
        </div>
      </div>
    </div>
  );
}

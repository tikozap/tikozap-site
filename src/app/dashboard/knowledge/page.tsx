import Link from 'next/link';

export default function KnowledgePage() {
  return (
    <div>
      <h1 className="db-title">Knowledge</h1>
      <p className="db-sub">Where the merchant edits store policies and FAQs.</p>

      <div style={{ marginTop: 14, border: '1px solid #e5e7eb', borderRadius: 16, padding: 14, background: '#fff' }}>
        <div style={{ fontWeight: 800 }}>Quick link</div>
        <p style={{ marginTop: 6, opacity: 0.8 }}>
          For now this reuses your onboarding page.
        </p>
        <Link className="db-btn primary" href="/onboarding/knowledge" style={{ display: 'inline-flex', marginTop: 10 }}>
          Open Knowledge Editor
        </Link>
      </div>
    </div>
  );
}

// src/app/dashboard/knowledge/page.tsx
import Link from 'next/link';

export default function KnowledgePage() {
  return (
    <div className="db-container">
      <div className="db-pageStack">
        <h1 className="db-title">Knowledge</h1>
        <p className="db-sub">Where the merchant edits store policies and FAQs.</p>

        <div className="db-card">
          <div className="db-cardTitle">Quick link</div>
          <p className="db-cardText">
            For now this reuses your onboarding page.
          </p>
          <Link
            className="db-btn primary"
            href="/onboarding/knowledge"
            style={{ display: 'inline-flex', marginTop: 10 }}
          >
            Open Knowledge Editor
          </Link>
        </div>
      </div>
    </div>
  );
}
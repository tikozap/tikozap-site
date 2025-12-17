'use client';

export default function SafetyShields() {
  return (
    <section className="safety-shields">
      <div className="container">
        {/* Heading + subtitle */}
        <header className="shields-head">
          <h2>Three safety shields</h2>
          <p className="small shields-sub">
            Built to be safe from day one - and always under your control.
          </p>
        </header>

        {/* Three cards */}
        <div className="shields-grid">
          {/* 1. Security checkups */}
          <article className="shield-card">
            <div className="shield-card-header">
              <span className="shield-icon shield-icon--green" aria-hidden="true">
                {/* Shield + check */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3.5L6 6v5.2c0 4.02 2.7 7.63 6 8.8 3.3-1.17 6-4.78 6-8.8V6l-6-2.5z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.3 12.1l1.9 1.9 3.5-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h3>Security checkups &amp; alerts</h3>
            </div>
            <p>
              TikoZap keeps an eye on risky settings and unusual activity. Your
              setup admin sees security checkups in the dashboard and by email,
              so you can fix issues before they become problems.
            </p>
          </article>

          {/* 2. Privacy & data ownership */}
          <article className="shield-card">
            <div className="shield-card-header">
              <span className="shield-icon shield-icon--blue" aria-hidden="true">
                {/* Shield + lock (so it’s really a shield, not just a lock) */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3.5L6 6v5.2c0 4.02 2.7 7.63 6 8.8 3.3-1.17 6-4.78 6-8.8V6l-6-2.5z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="9.3"
                    y="10.7"
                    width="5.4"
                    height="4.3"
                    rx="1.1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M10.7 10.7V9.4a1.9 1.9 0 0 1 3.8 0v1.3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <h3>Privacy &amp; data ownership</h3>
            </div>
            <p>
              Your store data stays yours. Chats, orders, and FAQs live safely
              in your workspace, and you can export or delete them at any time
              if you ever leave TikoZap.
            </p>
          </article>

          {/* 3. Safe actions & guardrails */}
          <article className="shield-card">
            <div className="shield-card-header">
              <span className="shield-icon shield-icon--purple" aria-hidden="true">
                {/* Shield + plus = controlled “allowed actions” */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3.5L6 6v5.2c0 4.02 2.7 7.63 6 8.8 3.3-1.17 6-4.78 6-8.8V6l-6-2.5z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 9.3v5.4M9.8 12h4.4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <h3>Safe actions &amp; guardrails</h3>
            </div>
            <p>
              The assistant can only take actions you approve. You define rules
              and limits for refunds, discounts, and order changes, and answers
              follow your approved docs and FAQs — with every step logged in the
              dashboard.
            </p>
          </article>
        </div>
      </div>

      <style jsx>{`
        .safety-shields {
          padding: 1.75rem 0 2.5rem;
        }

        .shields-head {
          text-align: left;
          margin-bottom: 1.25rem;
        }

        .shields-head h2 {
          margin: 0;
          font-size: 1.35rem;
          line-height: 1.3;
        }

        .shields-sub {
          margin-top: 0.25rem;
        }

        .shields-grid {
          display: grid;
          gap: 1rem;
        }

        .shield-card {
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 1.25rem 1.3rem 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .shield-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0 0 0.25rem;
        }

        .shield-card-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
        }

        .shield-card p {
          margin: 0;
          font-size: 0.92rem;
          color: #4b5563;
          line-height: 1.6;
        }

        .shield-icon {
          width: 2.4rem;
          height: 2.4rem;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .shield-icon svg {
          display: block;
        }

        .shield-icon--green {
          background: #ecfdf5;
          color: #16a34a;
        }

        .shield-icon--blue {
          background: #eef2ff;
          color: #2563eb;
        }

        .shield-icon--purple {
          background: #f5f3ff;
          color: #7c3aed;
        }

        @media (min-width: 768px) {
          .shields-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </section>
  );
}

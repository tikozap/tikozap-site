
export default function SafetyShields() {
  return (
    <section className="section-band-gray">
      <div className="container safety stack">
        <header className="stack safety-head">
          <p className="eyebrow">Three safety shields</p>
          <h2>Built to be safe from day one</h2>
          <p className="small">
            TikoZap is designed so your assistant can help customers fast —
            while your store data, policies, and brand stay under your control.
          </p>
        </header>

        <div className="safety-grid">
          {/* Shield 1 – green check */}
          <article className="safety-card">
            <div className="safety-icon-wrap safety-icon--green">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="safety-icon"
              >
                <path
                  d="M12 3l6 3v6.5c0 3.6-2.6 6.8-6 7.5-3.4-.7-6-3.9-6-7.5V6l6-3z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12.5l2 2.1 4-4.1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h3>Security checkups & alerts</h3>
              <p>
                Your setup admin surfaces security checkups in your dashboard
                and email — things like missing guardrails or risky actions —
                so you can fix issues before they become problems.
              </p>
            </div>
          </article>

          {/* Shield 2 – blue lock */}
          <article className="safety-card">
            <div className="safety-icon-wrap safety-icon--blue">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="safety-icon"
              >
                <path
                  d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  rx="2"
                  ry="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="14.5"
                  r="1"
                  fill="currentColor"
                />
                <path
                  d="M12 15.5v2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h3>Privacy & data ownership</h3>
              <p>
                Your store data stays yours. We scope what the assistant can see,
                log what it accesses, and make it easy to remove data if you ever
                leave TikoZap.
              </p>
            </div>
          </article>

          {/* Shield 3 – purple plus / guardrails */}
          <article className="safety-card">
            <div className="safety-icon-wrap safety-icon--purple">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="safety-icon"
              >
                <path
                  d="M12 3l7 3.5V13c0 3.8-3 7.2-7 8-4-0.8-7-4.2-7-8V6.5L12 3z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 9v6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12h6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h3>Safe actions & guardrails</h3>
              <p>
                Refunds, discounts, and order changes always follow rules you
                approve. The assistant can only take actions you’ve turned on,
                with every step logged in the dashboard.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

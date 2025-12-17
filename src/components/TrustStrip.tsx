'use client';

export default function TrustStrip() {
  return (
    <section
      className="trust-strip"
      aria-label="Why teams trust TikoZap"
    >
      <div className="container trust-strip__inner">
        <div className="trust-strip__copy">
          <p className="trust-strip__eyebrow">Why teams trust TikoZap</p>
          <p className="trust-strip__line">
            Data stays yours, actions are logged, and a human is always in control.
          </p>
        </div>

        <ul className="trust-strip__points">
          <li>Role-based access</li>
          <li>Full audit trail</li>
          <li>Easy human handoff</li>
        </ul>
      </div>

      <style jsx>{`
        .trust-strip {
          padding: 1.25rem 0 1.5rem;
        }

        .trust-strip__inner {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .trust-strip__eyebrow {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9ca3af;
          margin: 0 0 0.15rem;
        }

        .trust-strip__line {
          margin: 0;
          font-size: 0.95rem;
          color: #4b5563;
        }

        .trust-strip__points {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 1.25rem;
          font-size: 0.85rem;
          color: #6b7280;
        }

        .trust-strip__points li::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: #9ca3af;
          margin-right: 0.4rem;
        }

        @media (min-width: 768px) {
          .trust-strip__inner {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 1.5rem;
          }

          .trust-strip__copy {
            max-width: 26rem;
          }
        }
      `}</style>
    </section>
  );
}

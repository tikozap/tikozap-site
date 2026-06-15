// src/components/SafetyShields.tsx

"use client";

type Shield = {
  title: string;
  tone: "green" | "blue" | "purple";
  checks: string[];
};

const shields: Shield[] = [
  {
    title: "Security checkups & alerts",
    tone: "green",
    checks: [
      "Suspicious activity alerts",
      "Security health checks",
      "Email notifications",
    ],
  },
  {
    title: "Privacy & data ownership",
    tone: "blue",
    checks: [
      "100% data ownership",
      "Zero public LLM training",
      "Export or remove it anytime",
    ],
  },
  {
    title: "Safe actions & guardrails",
    tone: "purple",
    checks: [
      "AI stays within your limits",
      "Approval required for sensitive actions",
      "Every action is logged",
    ],
  },
];

export default function SafetyShields() {
  return (
    <section className="safety-shields">
      <header className="shields-head">
        <h2>Your business. Your data. Your rules.</h2>
        <p>
          Security, privacy, and control built into every workspace.
        </p>
      </header>

      <div className="shields-grid">
        {shields.map((shield) => (
          <article className="shield-card" key={shield.title}>
            <div className="shield-card-header">
              <span
                className={`shield-icon shield-icon--${shield.tone}`}
                aria-hidden="true"
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
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

              <h3>{shield.title}</h3>
            </div>

            <ul className="shield-list">
              {shield.checks.map((check) => (
                <li key={check}>
                  <span aria-hidden="true">✓</span>
                  {check}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <style jsx>{`
.safety-shields {
  padding: 4.5rem 0 5rem;
}

        .shields-head {
          max-width: 760px;
          margin-bottom: 2rem;
        }

        .shields-head h2 {
          margin: 0;
          font-size: clamp(34px, 3.3vw, 48px);
          line-height: 1.02;
          letter-spacing: -0.045em;
          font-weight: 800;
          color: #111827;
        }

        .shields-head p {
          max-width: 620px;
          margin: 1rem 0 0;
          font-size: 1.125rem;
          line-height: 1.6;
          color: #64748b;
        }

.shields-grid {
  display: grid;
  gap: 1.6rem;
}

.shield-card {
  border-radius: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.42);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
  padding: 2rem;
  min-height: 285px;
  display: flex;
  flex-direction: column;
  gap: 1.45rem;
  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.95) inset;
}

.shield-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.9) inset;
}

        .shield-card-header {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .shield-card-header h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 750;
          line-height: 1.25;
          color: #111827;
        }

.shield-icon {
  flex: 0 0 auto;
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.shield-icon svg {
  display: block;
  width: 38px;
  height: 38px;
}

.shield-icon--green {
  color: #15803d;
}

.shield-icon--blue {
  color: #1d4ed8;
}

.shield-icon--purple {
  color: #6d28d9;
}

.shield-list {
  list-style: none;
  padding: 0;
  margin: 0 0 0 2.85rem;
  display: grid;
  gap: 0.85rem;
}

.shield-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  font-size: 1.06rem;
  line-height: 1.45;
  color: #374151;
}

        .shield-list li span {
          margin-top: 0.05rem;
          color: #16a34a;
          font-weight: 800;
        }

        @media (min-width: 768px) {
          .shields-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (min-width: 960px) {
  .shields-head h2 {
    white-space: nowrap;
  }
}
      `}</style>
    </section>
  );
}
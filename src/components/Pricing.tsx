'use client';

import { useState } from 'react';
import Link from 'next/link';

type Plan = {
  id: string;
  name: string;
  badge?: string;
  monthly: number;
  yearly: number;
  highlights?: string;
  features: string[];
  focused?: boolean;
  cta: { href: string; label: string };
};

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 15,
    yearly: 12,
    highlights: 'For solo founders & tiny shops.',
    features: [
      '1 seat',
      'Up to 1,000 chats / month',
      '1 site',
      '1 data source',
      'Basic widget & FAQs',
      'Email support within 24–48 hours',
    ],
    cta: { href: '/signup?plan=starter', label: 'Get started on Starter' },
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Most popular',
    monthly: 35,
    yearly: 29,
    highlights: 'Most teams start here once they see the first wins.',
    features: [
      '2 seats',
      'Up to 5,000 chats / month',
      '3 sites',
      'Up to 5 data sources',
      'Workflows & automations',
      'Email support within 24 hours',
    ],
    focused: true,
    cta: { href: '/signup?plan=pro', label: 'Get started on Pro' },
  },
  {
    id: 'business',
    name: 'Business',
    monthly: 69,
    yearly: 59,
    highlights: 'For busy growing stores with higher volume.',
    features: [
      '5 seats',
      'Up to 15,000 chats / month',
      '5 sites',
      'Up to 15 data sources',
      'Advanced workflows & routing',
      'Priority support within 8 hours',
    ],
    cta: { href: '/signup?plan=business', label: 'Get started on Business' },
  },
  {
    id: 'agency',
    name: 'Agency / White-label',
    monthly: 179,
    yearly: 179,
    highlights: 'For agencies & resellers managing multiple clients.',
    features: [
      'Includes 5 client workspaces',
      'White-label portal & widget',
      'Custom domains per client',
      'Centralized billing',
      '+$10/mo per extra workspace',
      'Priority support within 4 hours',
    ],
    cta: { href: '/contact?sales=agency', label: 'Talk to sales' },
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section className="container">
      {/* Header row: text on left, toggle on right */}
      <div className="pricing-head">
        <div className="pricing-hero stack">
          <h2>Plans &amp; pricing</h2>
          <p className="small">
            Simple plans that scale with you. Choose monthly or yearly billing
            and switch any time.
          </p>
        </div>

        <div
          className="billing-toggle"
          role="group"
          aria-label="Billing period"
        >
          <button
            type="button"
            aria-pressed={!yearly}
            onClick={() => setYearly(false)}
          >
            Monthly
          </button>
          <button
            type="button"
            aria-pressed={yearly}
            onClick={() => setYearly(true)}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Pricing grid */}
      <div className="grid cols-1 pricing-grid">
        {PLANS.map((p) => (
          <article
            key={p.id}
            className={`plan ${p.focused ? 'plan--focus' : ''}`}
          >
            <header className="plan-header stack">
              <div className="plan-title-row">
                <h3 className="plan-title">{p.name}</h3>

                {/* Badge – yellow pill only for Pro, blue badge for others if needed */}
                {p.badge &&
                  (p.id === 'pro' ? (
                    <span className="plan-pill-popular">
                      <span className="plan-pill-popular-dot" />
                      {p.badge}
                    </span>
                  ) : (
                    <span className="badge">{p.badge}</span>
                  ))}
              </div>

              <div className="plan-price-row">
                <div className="plan-price-main">
                  <span className="price">
                    ${yearly ? p.yearly : p.monthly}
                  </span>
                  <span className="per">/month</span>
                </div>
                {p.id === 'agency' ? (
                  <p className="plan-note tiny">
                    Billed yearly. Agency pricing on request.
                  </p>
                ) : (
                  <p className="plan-note small">
                    Includes 14-day free trial. Change plans anytime.
                  </p>
                )}
              </div>

              {p.highlights && <p className="kicker">{p.highlights}</p>}
            </header>

            <ul className="features">
              {p.features.map((f) => (
                <li key={f}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M20 7L9 18l-5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* Bottom text: grey “New to TikoZap?” + link “Start your free trial” */}
            <div className="plan-footer tiny">
              {p.id === 'agency' ? (
                <Link href={p.cta.href} className="plan-text-link">
                  Talk to us about agency pricing
                </Link>
              ) : (
                <>
                  <span className="plan-footer-label">New to TikoZap?</span>{' '}
                  <Link href={p.cta.href} className="plan-text-link">
                    Start your free trial
                  </Link>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Global notes under the grid */}
      <div className="pricing-meta small">
        <p>
          <strong>Overage:</strong> $5 per extra 1,000 chats on all tiers (soft
          cap; auto-billed).
        </p>
        <p>
          <strong>Storage (fair use):</strong> Starter 50&nbsp;MB · Pro
          200&nbsp;MB · Business 1&nbsp;GB · Agency pooled 3&nbsp;GB, then
          $4/GB.
        </p>
        <p>
          <strong>Trials:</strong> 14-day full Pro trial with no card needed
          for Starter and Pro. Card required to trial Business or Agency.
        </p>
      </div>

      <style jsx>{`
        .pricing-head {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
          margin-bottom: 1.6rem;
        }

        .pricing-hero {
          text-align: left;
          align-items: flex-start;
          padding: 0.2rem 0 0.2rem;
        }

        .pricing-hero .small {
          max-width: 28rem;
        }

        /* Single billing toggle */
        .billing-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          padding: 0.1rem;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #f3f4f6;
          font-size: 0.8rem;
          margin-left: auto;
        }

        .billing-toggle button {
          border: none;
          background: transparent;
          padding: 0.25rem 0.7rem;
          border-radius: 999px;
          cursor: pointer;
          color: #6b7280;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .billing-toggle button[aria-pressed='true'] {
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
        }

        .pricing-grid {
          gap: 1.6rem;
        }

        .plan {
          display: flex;
          flex-direction: column;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 1.5rem 1.5rem 1.8rem;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.03);
          min-height: 30rem;
        }

        .plan--focus {
          border-color: #e5e7eb; /* same border color as other plans */
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06); /* soft neutral shadow */
        }

        .plan-header {
          gap: 0.5rem;
        }

        .plan-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .plan-title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 500;
          color: #111827;
        }

        /* Default badge (for any non-Pro future use) */
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.15rem 0.55rem;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* Yellow “Most popular” pill for Pro */
        .plan-pill-popular {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          background: #fef3c7; /* soft yellow */
          color: #92400e; /* dark amber text */
          font-size: 0.75rem;
          font-weight: 500;
          box-shadow: 0 4px 10px rgba(180, 83, 9, 0.18);
        }

        .plan-pill-popular-dot {
          width: 0.35rem;
          height: 0.35rem;
          border-radius: 999px;
          background: #facc15;
        }

        .plan-price-row {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.15rem;
        }

        .plan-price-main {
          display: flex;
          align-items: baseline;
          gap: 0.35rem;
        }

        .price {
          font-size: 1.9rem;
          font-weight: 600;
          color: #111827;
        }

        .per {
          font-size: 0.9rem;
          color: #4b5563;
        }

        .plan-note {
          margin: 0;
          color: #6b7280;
        }

        .kicker {
          margin: 0.15rem 0 0;
          font-size: 0.9rem;
          color: #4b5563;
        }

        .features {
          list-style: none;
          padding: 0;
          margin: 0.9rem 0 0;
          display: grid;
          gap: 0.35rem;
          font-size: 0.9rem;
          color: #374151;
        }

        .features li {
          display: flex;
          align-items: flex-start;
          gap: 0.35rem;
        }

        .features svg {
          margin-top: 0.12rem;
          color: #10b981;
        }

        .plan-footer {
          margin-top: auto;
          padding-top: 0.75rem;
        }

        .plan-footer-label {
          color: #6b7280; /* grey “New to TikoZap?” */
        }

        .plan-text-link {
          color: #2563eb;
          text-decoration: underline;
        }

        .plan-text-link:hover {
          color: #1d4ed8;
        }

        .pricing-meta {
          margin-top: 1.5rem;
          display: grid;
          gap: 0.35rem;
          max-width: 40rem;
        }

        .pricing-meta p {
          margin: 0;
        }

        .tiny {
          font-size: 0.8rem;
        }

        @media (min-width: 48rem) {
          .pricing-head {
            flex-direction: row;
            align-items: flex-end;
          }

          section.container > .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .pricing-grid {
            gap: 1.75rem;
          }
        }
      `}</style>
    </section>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';

type Plan = {
  name: string;
  badge?: string;
  monthly: number;
  yearly: number; // billed-monthly equivalent for yearly
  cta: { href: string; label: string };
  highlights?: string;
  features: string[];
  focused?: boolean;
};

const PLANS: Plan[] = [
  {
    name: 'Starter',
    monthly: 19,  // price if user selects Monthly
    yearly: 15,   // price shown when "Yearly" is selected (billed monthly equivalent)
    highlights: 'For solo stores getting started.',
    features: [
      '1 website / brand',
      'Up to 2,000 conversations / month',
      'Email support',
      'GDPR-ready',
    ],
    cta: { href: '/signup?plan=starter', label: 'Choose Starter' },
  },
  {
    name: 'Growth',
    badge: 'Popular',
    monthly: 49,
    yearly: 39,
    highlights: 'For growing shops that need automation.',
    features: [
      '3 websites / brands',
      'Up to 10,000 conversations / month',
      '24/7 email + chat support',
      'Custom workflows & actions',
      'Knowledge base sync',
      'Shopify / WooCommerce integration',
    ],
    focused: true,
    cta: { href: '/signup?plan=growth', label: 'Choose Growth' },
  },
  {
    name: 'Pro',
    monthly: 99,
    yearly: 79,
    highlights: 'For teams with higher volume.',
    features: [
      'Unlimited websites',
      '100k+ conversations / month',
      'Priority support',
      'SLA & audit logs',
      'Role-based access',
      'SSO (Google / Microsoft)',
    ],
    cta: { href: '/contact?sales=pro', label: 'Contact Sales' },
  },
];


export default function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section className="container">
      <div className="pricing-hero stack">
        <h2>Plans & pricing</h2>
        <p className="small">
          Simple plans that scale with you. {yearly && <span className="save-pill">2 months free yearly</span>}
        </p>

        <div className="billing-toggle" role="group" aria-label="Billing period">
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>Monthly</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>Yearly</button>
        </div>
      </div>

      <div className="grid cols-1" style={{ gap: "1rem" }}>
        {PLANS.map((p) => (
          <article key={p.name} className={`plan ${p.focused ? 'plan--focus' : ''}`}>
            <header className="stack">
              <div className="cluster" style={{ justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0 }}>{p.name}</h2>
                {p.badge && <span className="badge">{p.badge}</span>}
              </div>
              <div>
                <span className="price">${yearly ? p.yearly : p.monthly}</span>
                <span className="per">/month</span>
              </div>
              {p.highlights && <p className="kicker">{p.highlights}</p>}
            </header>

            <ul className="features">
              {p.features.map((f) => (
                <li key={f}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 7L9 18l-5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div>
              <Link className={`button${p.focused ? '' : ' button-outline'}`} href={p.cta.href}>
                {p.cta.label}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <style jsx>{`
        @media (min-width: 48rem) {
          section.container > .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>
    </section>
  );
}

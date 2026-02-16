// src/app/(marketing)/pricing/page.tsx
import Pricing from '@/components/Pricing';
import PricingFAQ from '@/components/PricingFAQ';
import PricingCompare from '@/components/PricingCompare';

export const metadata = { title: 'Pricing — TikoZap' };

export default function PricingPage() {
  return (
    <main id="main">
      {/* Plans in a soft lilac band (full width, tucked under nav) */}
      <section
        aria-labelledby="plans"
        style={{
          background: 'var(--bg-lilac)',
          padding: '0rem 0 2.5rem', // a bit less top padding
          marginTop: '-1.7rem',       // closes the tiny gap under nav
        }}
      >
        <div className="container stack">
          <h1 id="plans" className="sr-only">
            Plans &amp; pricing
          </h1>
          <Pricing />
        </div>
      </section>

      {/* Compare plans on white */}
      <section
        style={{
          background: '#ffffff',
          padding: '2rem 0 2rem',
        }}
      >
        <div className="container stack">
          <PricingCompare />
        </div>
      </section>

      {/* FAQ on light gray for variety */}
      <section
        style={{
          background: 'var(--bg-gray)',
          padding: '2rem 0 2.5rem',
        }}
      >
        <div className="container stack">
          <PricingFAQ />
        </div>
      </section>

      {/* Bottom-of-page CTA – centered on white */}

      <section
        aria-labelledby="pricing-get-started"
        style={{
          background: '#ffffff',
          padding: '1.25rem 0 0rem',  // ← slightly tighter top + bottom
          marginTop: '-0.75rem',
        }}
      >

        <div
          className="container stack"
          style={{ alignItems: 'center', textAlign: 'center' }}
        >
          <h2 id="pricing-get-started" className="sr-only">
            Get started with TikoZap
          </h2>
          <a href="/signup?plan=pro" className="button">
            Get started free
          </a>
          <p
            className="small"
            style={{ marginTop: '0.6rem', color: '#6b7280' }}
          >
            You&apos;ll start with a 14-day Pro trial. No credit card required.
          </p>
        </div>
      </section>
    </main>
  );
}

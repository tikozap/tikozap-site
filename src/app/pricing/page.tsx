// src/app/pricing/page.tsx

import Pricing from '@/components/Pricing';
import PricingFAQ from '@/components/PricingFAQ';
import PricingCompare from '@/components/PricingCompare';

export const metadata = { title: 'Pricing — TikoZap' };

export default function PricingPage() {
  return (
    <main id="main">
      <section
        aria-labelledby="plans"
        style={{
          background: 'var(--bg-lilac)',
padding: '2.25rem 0 3rem',
marginTop: '0',
        }}
      >
        <div className="container-xl stack">
          <h1 id="plans" className="sr-only">
            Plans &amp; pricing
          </h1>
          <Pricing />
        </div>
      </section>

      {/* Realtime Voice Concierge */}
      <section
        aria-labelledby="voice-concierge"
        style={{
          background: '#ffffff',
          padding: '2.25rem 0 2.25rem',
        }}
      >
        <div
  className="container-xl"
  style={{ maxWidth: '1100px', margin: '0 auto' }}
>
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '1.25rem',
              background:
                'linear-gradient(135deg, #ffffff 0%, #f8fafc 45%, #eef2ff 100%)',
              padding: '1.6rem',
              boxShadow: '0 14px 32px rgba(15, 23, 42, 0.06)',
            }}
          >
            <p
              className="small"
              style={{
                margin: '0 0 0.45rem',
                color: '#2563eb',
                fontWeight: 600,
              }}
            >
              Optional voice add-on
            </p>

            <h2
              id="voice-concierge"
              style={{
                margin: 0,
                fontSize: '1.55rem',
                lineHeight: 1.2,
                color: '#111827',
              }}
            >
              Realtime Voice Concierge
            </h2>

            <p
              className="small"
              style={{
                margin: '0.65rem 0 1.1rem',
                maxWidth: '42rem',
                color: '#4b5563',
              }}
            >
              Let shoppers talk naturally with your AI assistant for product
              questions, support, and quick help. Every plan includes{' '}
              <strong>20 free voice questions per day</strong> during MVP.
            </p>

            <div
              style={{
                display: 'grid',
                gap: '0.75rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              }}
            >
              {[
                '20 free voice questions/day',
                'Natural product and support conversations',
                'Voice usage tracked per store',
                'Paid voice packs coming soon',
              ].map((item) => (
                <div
                  key={item}
                  className="small"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.45rem',
                    color: '#374151',
                  }}
                >
                  <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          background: '#ffffff',
          padding: '2rem 0 2rem',
        }}
      >
<div
  className="container-xl stack"
  style={{ maxWidth: '1100px', margin: '0 auto' }}
>
  <PricingCompare />
</div>
      </section>

      <section
        style={{
          background: 'var(--bg-gray)',
          padding: '2rem 0 2.5rem',
        }}
      >
  <div
  className="container-xl stack"
  style={{ maxWidth: '900px', margin: '0 auto' }}
>
  <PricingFAQ />
</div>
      </section>

      <section
        aria-labelledby="pricing-get-started"
        style={{
          background: '#ffffff',
          padding: '1.25rem 0 0rem',
          marginTop: '-0.75rem',
        }}
      >
        <div
          className="container-xl stack"
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
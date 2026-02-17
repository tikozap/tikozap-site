'use client';

import HowItWorksGraphic from '../components/HowItWorksGraphic';
import SafetyShields from '@/components/SafetyShields';
import Image from 'next/image';

export default function Page() {
  return (
    <main id="main" className="has-sticky">
      {/* Hero – full-width light gray band, content in container */}
      <section className="section-band-gray hero-band">
        <div className="container hero stack">
          <h1 className="hero-title">Instant AI customer support for your store</h1>

          <p className="sub">
            Easy setup • Affordable pricing •{' '}
            <span className="nowrap">24/7&nbsp;on-call.</span>
          </p>

          <div className="cluster hero-ctas" style={{ justifyContent: 'center' }}>
            <a className="button" href="/signup?plan=pro">
              Get started free
            </a>
            <a className="button-outline" href="/demo">
              Live demo
            </a>
          </div>

          <div className="helpers">
            <span>No credit card required for trial</span>
            <span className="dot" />
            <span>Cancel anytime</span>
          </div>

          <p
            className="hero-microtrust small"
            style={{ textAlign: 'center', marginTop: '0.75rem' }}
          >
            Actions always under your control.
          </p>
        </div>
      </section>

      {/* How it works – full-width lilac band */}
      <section className="section-band-lilac">
        <div className="container-wide">
          <HowItWorksGraphic />
        </div>
      </section>

      {/* Three safety shields */}
      <section className="section-band-white">
        <div className="container stack">
          <SafetyShields />
        </div>
      </section>

      {/* Testimonials – three bubbles */}
      <section className="section-band-gray">
        <div className="container testimonials stack">
          <header className="testimonials-head stack">
            <p className="small testimonials-eyebrow">What teams say</p>
            <h2 className="testimonials-title">
              “It feels like we hired a 24/7 support rep.”
            </h2>
          </header>

          <div className="testimonials-art-wrap">
            <Image
              src="/art/threebubbles.svg"
              alt="Conversations showing teams using TikoZap"
              className="testimonials-art"
              width={543}
              height={453}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Homepage bottom CTA on white */}
      {/* Bottom CTA – mirror Pricing page spacing */}
      <section
        className="section-band-white home-cta-band"
        aria-labelledby="home-pricing-cta"
      >
        <div className="container stack home-cta">
          <h2 id="home-pricing-cta" className="sr-only">
            View TikoZap pricing
          </h2>

          {/* Blue button with white text (same as Pricing page) */}
          <a href="/pricing" className="button">
            View pricing
          </a>

          <p className="small">
            You&apos;ll start with a 14-day Pro trial. No credit card required.
          </p>
        </div>
      </section>


      <style jsx>{`
        /* Reduce gap between navbar and hero heading */
        .hero {
          padding-top: 2.5rem;
        }

        @media (min-width: 768px) {
          .hero {
            padding-top: 3rem;
          }
        }

        /* === Home: testimonials === */

        .testimonials {
          padding: 2.8rem 0 3rem;
        }

        .testimonials-head {
          align-items: flex-start;
          text-align: left;
          gap: 0.25rem;
        }

        .testimonials-eyebrow {
          margin: 0;
          letter-spacing: 0.08em;
          text-transform: none; /* no ALL CAPS */
          color: var(--muted);
        }

        .testimonials-title {
          margin: 0;
        }

        .testimonials-art-wrap {
          display: flex;
          justify-content: center;
        }

        .testimonials-art {
          width: min(560px, 100%); /* bigger bubbles -> more readable text */
          max-width: 560px;
          height: auto;
        }

        /* === Home: bottom CTA (match Pricing spacing) === */
        .home-cta-band {
          padding: 1rem 0 0rem; /* same vertical rhythm as Pricing CTA */
        }

        .home-cta {
          align-items: center;
          text-align: center;
        }

        .home-cta .small {
          margin-top: 0.6rem;
        }
      `}</style>
    </main>
  );
}

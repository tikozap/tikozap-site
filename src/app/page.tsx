// src/app/page.tsx

"use client";

import SafetyShields from "@/components/SafetyShields";
import Image from "next/image";
import HeroDemoPanel from "@/components/HeroDemoPanel";
import StarterLinkShowcase from "@/components/StarterLinkShowcase";

export default function Page() {
  return (
    <main id="main" className="has-sticky">
      <section className="section-band-gray hero-new">
        <div className="container-xl hero-grid">
          <div className="hero-left">
<h1 className="hero-title">
  <span className="hero-title-main">A trained AI employee</span>
  <span className="hero-title-sub">for your store</span>
</h1>

<p className="hero-sub hero-sub-desktop">
  Answers customers 24/7, learns your business,<br />
  works with your team, and improves through coaching.
</p>

<p className="hero-sub hero-sub-mobile">
  Answers customers 24/7, works with your team,<br />
  learns your business, &amp; improves through coaching.
</p>

            <div className="hero-ctaBlock">
              <a className="button" href="/signup?plan=pro">
                Free Pro 14-day trial
              </a>

              <p className="hero-trust">No credit card required.</p>

              <div className="hero-paths">
                <p>✓ Have a website? Add the TikoZap widget.</p>
                <p>✓ Don&apos;t have one? Launch with Starter Link.</p>
              </div>
            </div>
          </div>

          <HeroDemoPanel />
        </div>
      </section>

      <StarterLinkShowcase />

      <section className="section-band-white">
        <div className="container-xl stay-control">
<h2 className="stay-control-title">
  Stay in control
</h2>

<p className="stay-control-sub">
  Monitor and coach your AI employee in one inbox.
</p>

<Image
  src="/art/stay-in-control-desktop-mobile.png"
            alt="Manage customer conversations from desktop and mobile with human takeover and AI assistance."
            width={6525}
            height={4597}
            className="stay-control-image"
            priority={false}
          />
        </div>
      </section>

      <section className="section-band-white">
<div className="container-xl stack">
  <SafetyShields />
</div>
      </section>

<section className="section-band-white rating-strip">
  <div className="container-xl">
<div className="rating-row">
  <span className="rating-stars" aria-label="4.6 out of 5 stars">
    ★★★★<span className="star-half">★</span>
  </span>
  <span className="rating-score">4.6</span>
  <span className="rating-text">(218+ reviews)</span>
</div>
  </div>
</section>

      <section
        className="section-band-white home-cta-band"
        aria-labelledby="home-pricing-cta"
      >
       <div className="container-xl stack home-cta">
          <h2 id="home-pricing-cta" className="sr-only">
            View TikoZap pricing
          </h2>

          <a href="/pricing" className="button">
            View pricing
          </a>

          <p className="small">
            You&apos;ll start with a 14-day Pro trial. No credit card required.
          </p>
        </div>

      </section>

<script
  src="http://192.168.1.160:3000/widget.js"
  data-tikozap-key="tz_1bf3625186119c6aabaa6df7621ea383"
/>

      <style jsx>{`
        .hero-paths {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .hero-paths p {
          margin: 0;
          font-size: 0.95rem;
          color: #475569;
        }

        .stay-control {
          padding: 3rem 0 4rem;
        }

        .stay-control-title {
          margin: 0 0 1.5rem;
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 800;
          line-height: 1.02;
          letter-spacing: -0.045em;
          color: #111827;
        }

.stay-control-sub {
  max-width: none;
  margin: 0.65rem 0 2rem;
  font-size: 1.3rem;
  line-height: 1.45;
  color: #475569;
}

        .stay-control-image {
          display: block;
          width: 100%;
          height: auto;
          border-radius: 16px;
        }

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
          text-transform: none;
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
          width: min(560px, 100%);
          max-width: 560px;
          height: auto;
        }

.home-cta .button {
  min-width: 170px;
  padding: 0.9rem 1.35rem;
  font-size: 1.25rem;
  border-radius: 0.8rem;
}

        .home-cta-band {
          padding: 1.75rem 0 0rem;
        }

        .home-cta {
          align-items: center;
          text-align: center;
        }

        .home-cta .small {
          margin-top: 0.6rem;
        }

        .rating-strip {
  padding: 1.50rem 0 2.5rem;
}

.rating-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.rating-stars {
  color: #22c55e;
  font-size: 2rem;
  letter-spacing: 0.08em;
  line-height: 1;
  margin-right: 0.35rem;
}

.star-half {
  display: inline-block;
  width: 0.55em;
  overflow: hidden;
  vertical-align: bottom;
}

.rating-score {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
}

.rating-text {
  font-size: 1.25rem;
  color: #64748b;
}
      `}</style>
    </main>
  );
}
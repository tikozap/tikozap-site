// src/app/page.tsx

"use client";

import { useState } from "react";
import HowItWorksGraphic from "../components/HowItWorksGraphic";
import SafetyShields from "@/components/SafetyShields";
import Image from "next/image";
import HeroOrbPreview from "@/components/HeroOrbPreview";
import HeroDemoModal from "@/components/HeroDemoModal";

type DemoMode = "chat" | "voice";

export default function Page() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoMode, setDemoMode] = useState<DemoMode>("voice");

  function openDemo(mode: DemoMode) {
    setDemoMode(mode);
    setDemoOpen(true);
  }

  return (
    <main id="main" className="has-sticky">
      <section className="section-band-gray hero-new">
        <div className="container hero-grid">
          <div className="hero-left">
            <h1 className="hero-title">
              Instant AI support
              <br />
              for your store
            </h1>

            <p className="hero-sub">
              Easy setup. Affordable pricing. 24/7 on-call.
            </p>

            <div className="hero-cta">
              <a className="button" href="/signup?plan=pro">
                Free Pro 14-day trial
              </a>
            </div>

            <p className="hero-trust">No credit card required.</p>
          </div>

          <HeroOrbPreview
            onPenClick={() => openDemo("chat")}
            onMicClick={() => openDemo("voice")}
          />
        </div>
      </section>

      <HeroDemoModal
        open={demoOpen}
        mode={demoMode}
        onClose={() => setDemoOpen(false)}
      />

      <section className="section-band-lilac">
        <div className="container-wide">
          <HowItWorksGraphic />
        </div>
      </section>

      <section className="section-band-white">
        <div className="container stack">
          <SafetyShields />
        </div>
      </section>

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

      <section
        className="section-band-white home-cta-band"
        aria-labelledby="home-pricing-cta"
      >
        <div className="container stack home-cta">
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

      <style jsx>{`
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

        .home-cta-band {
          padding: 1rem 0 0rem;
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
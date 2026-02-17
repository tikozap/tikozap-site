'use client';

import DemoChat from '@/components/DemoChat';

export default function DemoPage() {
  return (
    <main id="main">
      <section className="section-band-white">
        <div className="container demo-page stack">
          <header className="demo-page-head stack">
            <p className="eyebrow small">Live demo (safe preview)</p>
            <h1>Try the TikoZap assistant live</h1>
            <p className="sub">
              Ask real merchant-evaluation questions and see how TikoZap handles
              support quality, human handoff, and Starter Link workflows for
              SBOs without websites.
            </p>
            <div className="demo-page-checklist">
              <span>Safe preview mode</span>
              <span>Starter Link capable</span>
              <span>Human takeover ready</span>
              <span>Two-layer quality scoring</span>
            </div>
          </header>

          <DemoChat />

          <div className="demo-page-cta-row">
            <a className="button" href="/signup?plan=pro">
              Start free trial
            </a>
            <a className="button-outline" href="/onboarding/install">
              Explore Starter Link setup
            </a>
          </div>
        </div>
      </section>

      <style jsx>{`
        .demo-page {
          padding: 2.5rem 0 3rem;
        }

        .demo-page-head {
          gap: 0.4rem;
        }

        .demo-page-head h1 {
          margin-bottom: 0.15rem;
        }

        .demo-page-head .sub {
          max-width: 34rem;
        }

        .demo-page-checklist {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 0.15rem;
        }

        .demo-page-checklist span {
          font-size: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 0.18rem 0.5rem;
          background: #f9fafb;
          color: #4b5563;
        }

        .demo-page-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          justify-content: flex-start;
        }

        @media (max-width: 640px) {
          .demo-page {
            padding-top: 1.8rem;
          }
        }
      `}</style>
    </main>
  );
}

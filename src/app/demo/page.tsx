'use client';

import DemoChat from '@/components/DemoChat';

export default function DemoPage() {
  return (
    <main id="main">
      <section className="section-band-white">
        <div className="container demo-page stack">
          <header className="demo-page-head stack">
            <p className="eyebrow small">Live demo (safe preview)</p>
            <h1>Try the TikoZap assistant</h1>
            <p className="sub">
              Ask a few store-style questions to see how your AI assistant could
              handle orders, shipping, and returns — while keeping you in
              control.
            </p>
          </header>

          <DemoChat />
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

        @media (max-width: 640px) {
          .demo-page {
            padding-top: 1.8rem;
          }
        }
      `}</style>
    </main>
  );
}

'use client';

export default function HowItWorksGraphic() {
  return (
    <section className="hiw-section">
      {/* Heading uses standard container for consistent left edge */}
      <div className="container hiw-head stack" style={{ textAlign: 'left' }}>
        <h2>How it works</h2>
        <p className="small">
          Set it up once. TikoZap handles questions and approved actions – grounded in
          your store data and policies.
        </p>
      </div>

      {/* Graphic: new SVG file */}
      <div className="container-wide hiw-inner">
        <div className="hiw-wrap">
          <img
            src="/art/how-it-works.svg"
            alt="Circular flow showing how TikoZap connects your site, customers, and guardrails."
            loading="lazy"
            className="hiw-img"
          />
        </div>
      </div>

      {/* Screen reader outline of the steps */}
      <ol className="sr-only">
        <li>Paste one snippet — install once, no code.</li>
        <li>Widget goes live — branded chat bubble, instantly.</li>
        <li>Ask anything — orders, returns, shipping, products, policies.</li>
        <li>Understands and finds sources — retrieves answers with context.</li>
        <li>Resolves with guardrails — actions follow your rules.</li>
        <li>Handoff and log — escalate with context; keep a record.</li>
      </ol>

      <style jsx>{`
        .hiw-wrap {
          max-width: 520px;
          margin: 0 auto;
        }

        .hiw-img {
          width: 100%;
          height: auto;
          display: block;
        }

        .hiw-inner {
          margin-top: 2rem;
        }
      `}</style>
    </section>
  );
}

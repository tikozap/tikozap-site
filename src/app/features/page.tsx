// src/app/features/page.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

const productFeatures = [
  {
    title: "Learns",
    body: "Starts learning your business from day one.",
  },
  {
    title: "Helps",
    body: "Supports your customers 24/7.",
  },
  {
    title: "Communicates",
    body: "Chats, speaks, and answers phone calls.",
  },
  {
    title: "Protects",
    body: "Keeps your business and customer data secure.",
  },
  {
    title: "Connects",
    body: "Speaks your customers' language.",
  },
  {
    title: "Collaborates",
    body: "Works with your team and follows your guidance.",
  },
];

const steps = [
  {
    title: "Create your workspace",
    body: "Set up your company information and add your products, policies, and business knowledge.",
  },
  {
    title: "Work with your AI employee",
    body: "Introduce your business so your AI employee is ready to help customers.",
  },
  {
    title: "Your AI employee helps",
    body: "Chats, speaks, answers phone calls, and supports customers using what you've instructed.",
  },
  {
    title: "Grow together",
    body: "Monitor conversations, step in when needed, and coach your AI employee over time.",
  },
];

const faqs = [
  {
    q: 'Can your assistant answer questions about my products?',
    a: 'Yes. Your assistant answers using your products, FAQs, store policies, and uploaded documents, so responses reflect your business—not generic AI knowledge.',
  },
  {
    q: 'What if the assistant gives the wrong answer?',
    a: 'You can correct your assistant anytime. It remembers your coaching and handles similar conversations better in the future.',
  },
  {
    q: 'Can I take over conversations?',
    a: "Absolutely. You can step into any conversation whenever needed, then let your assistant continue once you're finished.",
  },
  {
    q: 'Does it support multiple languages?',
    a: 'Yes. Your assistant communicates with customers in their preferred language while using your store knowledge to provide accurate answers.',
  },
  {
    q: 'Can I use TikoZap without a website?',
    a: "Yes. Launch instantly with Starter Link, then connect your own website whenever you're ready.",
  },
  {
    q: 'Who owns my business data?',
    a: 'You do. Your products, knowledge, customer conversations, and business data always remain yours.',
  },
  {
    q: 'How long does setup take?',
    a: 'Most stores can have their AI employee helping customers within minutes after connecting their store and adding basic business knowledge.',
  },
];

export default function ProductPage() {
  return (
    <main id="main" className="product-page">
      <section className="product-hero">
        <div className="container-xl product-hero-inner">
<h1>
  Meet your AI employee
</h1>

<p>
  Answers customers, learns your business, and works alongside your team.
</p>

          <div className="product-orbit-wrap">
            <Image
              src="/art/product-orbit.png"
              alt="TikoZap product overview with support, multilingual chat, security, live chat, and human handoff"
              width={1200}
              height={800}
              className="product-orbit"
              priority
            />
          </div>
        </div>
      </section>

      <section className="product-section features-section">
        <div className="container-xl">
          <div className="feature-grid">
            {productFeatures.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <h2>{feature.title}</h2>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="product-section how-section">
        <div className="container-xl">
          <header className="section-head">
<h2>Working together is simple</h2>
<p>Your AI employee works while you monitor and coach.</p>
          </header>

          <div className="steps-grid">
            {steps.map((step, index) => (
              <article className="step-item" key={step.title}>
                <span className="step-watermark">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="product-section faq-section">
        <div className="container-xl faq-shell">
          <header className="section-head">
            <h2>Product FAQ</h2>
            <p>Quick answers for store owners getting started with TikoZap.</p>
          </header>

          <div className="faq-list">
            {faqs.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>
                  <span>{item.q}</span>
                  <span className="faq-arrow" aria-hidden="true" />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="product-cta">
        <div className="container-xl">
          <Link href="/signup?plan=pro" className="button">
            Get started free
          </Link>
          <p>You&apos;ll start with a 14-day Pro trial. No credit card required.</p>
        </div>
      </section>

      <style jsx>{`
        .product-hero {
          background: #ffffff;
          padding: 3.25rem 0 2.25rem;
        }

        .product-hero-inner {
          text-align: center;
        }

        .product-hero h1 {
          max-width: 980px;
          margin: 0 auto;
          font-size: clamp(38px, 4.4vw, 62px);
          line-height: 1.03;
          letter-spacing: -0.055em;
          font-weight: 850;
          color: #111827;
        }

        .product-hero p {
          max-width: 860px;
          margin: 1.1rem auto 0;
          font-size: clamp(17px, 1.35vw, 21px);
          line-height: 1.55;
          color: #64748b;
        }

        .product-orbit-wrap {
          margin: 2.1rem auto 0;
          max-width: 850px;
        }

        .product-orbit {
          display: block;
          width: 100%;
          height: auto;
        }

        .product-section {
          background: #ffffff;
          padding: 3rem 0;
        }

        .features-section {
          padding-top: 1.5rem;
        }

        .feature-grid {
          display: grid;
          gap: 1.25rem;
        }

        .feature-card {
          border: 1px solid rgba(203, 213, 225, 0.9);
          border-radius: 1.35rem;
          background: #ffffff;
          padding: 1.7rem;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.055);
        }

        .feature-card h2 {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.25;
          font-weight: 800;
          color: #111827;
        }

        .feature-card p {
          margin: 0.75rem 0 0;
          color: #4b5563;
          line-height: 1.6;
          font-size: 1rem;
        }

.how-section {
  background: #f8fafc;
  padding: 4rem 0 3.5rem;
}

        .section-head {
          max-width: 760px;
          margin-bottom: 2rem;
        }

        .section-head h2 {
          margin: 0;
          font-size: clamp(34px, 3.3vw, 48px);
          line-height: 1.05;
          letter-spacing: -0.045em;
          font-weight: 800;
          color: #111827;
        }

        .section-head p {
          margin: 0.85rem 0 0;
          color: #64748b;
          font-size: 1.1rem;
          line-height: 1.55;
        }

        .steps-grid {
          display: grid;
          gap: 1.4rem;
        }

.step-item {
  position: relative;
  min-height: 135px;
  padding: 0.8rem 0.75rem 1.1rem 0;
}

.step-watermark {
  position: absolute;
  top: 20px;
  left: 35%;
  transform: translateX(-50%);
  font-size: 6.8rem;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.08em;
  color: rgba(37, 99, 235, 0.055);
  pointer-events: none;
  user-select: none;
}

.step-item h3 {
  position: relative;
  margin: 1.65rem 0 0;
  color: #111827;
  font-size: 1.15rem;
  font-weight: 800;
  z-index: 1;
}

.step-item p {
  position: relative;
  margin: 0.55rem 0 0;
  color: #4b5563;
  line-height: 1.6;
  max-width: 16rem;
  z-index: 1;
}

        .faq-shell {
          max-width: 1000px;
        }

        .faq-list {
          display: grid;
          gap: 0.7rem;
        }

        .faq-item {
          border-radius: 0.9rem;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 0.85rem 1rem;
        }

        .faq-item summary {
          list-style: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          color: #111827;
          font-weight: 650;
        }

        .faq-item summary::-webkit-details-marker {
          display: none;
        }

        .faq-arrow {
          width: 11px;
          height: 11px;
          border-right: 1.6px solid #6b7280;
          border-bottom: 1.6px solid #6b7280;
          transform: rotate(45deg);
          transition: transform 0.18s ease;
          flex: 0 0 auto;
        }

        details[open] .faq-arrow {
          transform: rotate(-135deg);
        }

        .faq-item p {
          margin: 0.65rem 0 0;
          color: #4b5563;
          line-height: 1.6;
        }

        .product-cta {
          background: #ffffff;
          padding: 1.5rem 0 3rem;
          text-align: center;
        }

        .product-cta .button {
          min-width: 170px;
          padding: 0.9rem 1.35rem;
          font-size: 1rem;
          border-radius: 0.8rem;
        }

        .product-cta p {
          margin: 0.7rem 0 0;
          color: #64748b;
          font-size: 0.95rem;
        }

        @media (min-width: 768px) {
          .feature-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .steps-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

@media (max-width: 767px) {
  .steps-grid {
    gap: 2.25rem;
  }

  .step-item {
    display: grid;
    grid-template-columns: 5.5rem 1fr;
    column-gap: 1.25rem;
    min-height: 0;
    padding: 0;
  }

  .step-watermark {
    position: static;
    transform: none;
    grid-column: 1;
    grid-row: 1 / span 2;
    font-size: 5.6rem;
    line-height: 0.9;
    color: rgba(37, 99, 235, 0.075);
  }

  .step-item h3 {
    grid-column: 2;
    grid-row: 1;
    margin: 0;
  }

  .step-item p {
    grid-column: 2;
    grid-row: 2;
    margin-top: 0.55rem;
    max-width: none;
  }

.product-orbit-wrap {
  max-width: 108%;
  width: 108%;
  margin-left: -4%;
  margin-right: -4%;
}
}
      `}</style>
    </main>
  );
}
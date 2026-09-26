// src/components/PricingFAQ.tsx

'use client';

const faqs = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. There are no long-term contracts. You can change or cancel your subscription whenever you like.',
  },
  {
    q: "What's the difference between monthly and yearly plans?",
    a: 'Monthly plans offer flexibility, while yearly plans save money with discounted pricing.',
  },
  {
    q: 'What happens if I reach my conversation limit?',
    a: "We'll let you know before you reach your limit and provide simple options to upgrade or add more capacity.",
  },
  {
    q: 'Can I change plans later?',
    a: 'Absolutely. Upgrade or downgrade your plan anytime as your business grows.',
  },
  {
    q: 'Do I need technical skills to set up TikoZap?',
    a: 'No. Most merchants can get started without coding. If you have a website, simply add our widget. If not, use Starter Link to begin immediately.',
  },
  {
    q: 'Does TikoZap work with Shopify?',
    a: 'Yes. Shopify is fully supported, with support for additional ecommerce platforms continuing to expand.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Every plan includes built-in security, privacy protection, and full ownership of your business data.',
  },
];

export default function PricingFAQ() {
  return (
    <section className="faq" aria-labelledby="pricing-faq-heading">
      <header className="stack faq-head">
        <h2 id="pricing-faq-heading">Pricing FAQ</h2>
        <p className="small">
          Everything you need to know about pricing and billing.
        </p>
      </header>

      <div className="stack">
        {faqs.map(({ q, a }: any) => (
          <details key={q} className="faq-item">
            <summary>
              <span className="faq-question">{q}</span>
              {/* clean hollow chevron, no text, no pill */}
              <span className="faq-arrow" aria-hidden="true" />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>

      <style jsx>{`
        .faq-item {
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 0.7rem 0.9rem;
        }

        .faq-item + .faq-item {
          margin-top: 0.5rem;
        }

        /* Remove native marker */
        .faq-item summary {
          list-style: none;
        }
        .faq-item summary::-webkit-details-marker {
          display: none;
        }

        .faq-item summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          cursor: pointer;
        }

        .faq-question {
          font-weight: 500;
          color: #111827;
        }

        /* >>> clean hollow chevron <<< */
        .faq-arrow {
          flex-shrink: 0;
          width: 11px;
          height: 11px;
          border-right: 1.6px solid #6b7280;
          border-bottom: 1.6px solid #6b7280;
          transform: rotate(45deg); /* ▼ (down) when closed */
          transform-origin: center;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }

        /* Open → rotate to point up, no pill, no background */
        details[open] .faq-arrow {
          transform: rotate(-135deg); /* ▲ */
          border-color: #4b5563;
        }

        /* Kill any old global ::after chevron and “hide-last-child” rule */
        .faq-item summary::after {
          content: '';
          display: none !important;
        }
        .faq-item summary > *:last-child {
          display: inline-flex !important;
        }

        .faq-item p {
          margin: 0.6rem 0 0;
          color: #4b5563;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .faq-head {
          text-align: left;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .faq-head .small {
          max-width: 32rem;
        }
      `}</style>
    </section>
  );
}

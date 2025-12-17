'use client';

const faqs = [
  {
    q: "Monthly vs yearly — what's the difference?",
    a: "Yearly saves you money (shown as a lower monthly equivalent) and is billed annually upfront. Monthly is pay-as-you-go with no long-term commitment.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can cancel effective at the end of your current billing period. You can also switch plans at any time.',
  },
  {
    q: 'What happens if I exceed my conversation limits?',
    a: 'We’ll notify you and keep serving conversations with a soft overage. You can upgrade or set a cap in settings.',
  },
  {
    q: 'Do you support Shopify / WooCommerce?',
    a: 'Yes. We provide native integrations to pull orders, tracking, and customer info so your assistant can resolve questions instantly.',
  },
  {
    q: 'Is my data secure? GDPR?',
    a: 'We follow security best practices, offer GDPR-friendly features, and provide audit logs on higher tiers. Data processing is covered by our DPA.',
  },
  {
    q: 'Do you offer support SLAs?',
    a: 'Priority support and SLAs are available on Pro and above. Contact sales for details.',
  },
];

export default function PricingFAQ() {
  return (
    <section className="container faq" aria-labelledby="pricing-faq-heading">
      <header className="stack faq-head">
        <h2 id="pricing-faq-heading">Pricing FAQ</h2>
        <p className="small">
          Everything you need to know about pricing and billing.
        </p>
      </header>

      <div className="stack">
        {faqs.map(({ q, a }) => (
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

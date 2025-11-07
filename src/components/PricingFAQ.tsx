export default function PricingFAQ() {
  const faqs = [
    {
      q: "Monthly vs yearly — what's the difference?",
      a: "Yearly saves you money (shown as a lower monthly equivalent) and is billed annually upfront. Monthly is pay-as-you-go with no long-term commitment."
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. Cancel effective at the end of your current billing period. You can also switch plans at any time."
    },
    {
      q: "What happens if I exceed my conversation limits?",
      a: "We’ll notify you and keep serving conversations with a soft overage. You can upgrade or set a cap in settings."
    },
    {
      q: "Do you support Shopify / WooCommerce?",
      a: "Yes. We provide native integrations to pull orders, tracking, and customer info to resolve questions instantly."
    },
    {
      q: "Is my data secure? GDPR?",
      a: "We follow security best practices, offer GDPR-friendly features, and provide audit logs on Pro. Data processing is covered by our DPA."
    },
    {
      q: "Do you offer support SLAs?",
      a: "Priority support and SLAs are available on Pro. Contact sales for details."
    }
  ];

  return (
    <section className="container faq">
      <header className="stack" style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2>Frequently asked questions</h2>
        <p className="small">Everything you need to know about pricing and billing.</p>
      </header>

      <div className="stack">
        {faqs.map(({ q, a }) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}


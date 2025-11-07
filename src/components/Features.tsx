export default function Features() {
  const items = [
    { title: '24/7 AI Support', body: 'Always-on chat that answers instantly, no staffing needed.',
      icon: (
        <svg className="feature-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9h6l3 3v-9a9 9 0 0 0-9-9Z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { title: 'Store Integrations', body: 'Connect Shopify or WooCommerce and resolve order questions.',
      icon: (
        <svg className="feature-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 7l9-4 9 4v10l-9 4-9-4V7Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 7l9 4 9-4" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    { title: 'Custom Workflows', body: 'Automate refunds, cancellations, and returns with guardrails.',
      icon: (
        <svg className="feature-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
                stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    { title: 'Knowledge Sync', body: 'Pull answers from your FAQs, policies, and docs automatically.',
      icon: (
        <svg className="feature-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 7h8M8 11h8M8 15h5" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    },
    { title: 'GDPR & Security', body: 'Compliance-friendly by design with audit trails and SSO.',
      icon: (
        <svg className="feature-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3l7 4v5a9 9 0 0 1-14 7 9 9 0 0 1-3-7V7l10-4Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    { title: 'Analytics', body: 'Track resolutions, deflection rate, and CSAT over time.',
      icon: (
        <svg className="feature-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 20V4M4 20h16" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 16v-5M12 16V8M16 16v-8" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
  ];

  return (
    <section className="container stack" style={{ padding: "2rem 0" }}>
      <header className="stack" style={{ textAlign: 'center' }}>
        <h1>Features</h1>
        <p className="small">Everything you need to offer instant, accurate support.</p>
      </header>

      <div className="grid features-grid cols-1">
        {items.map((it) => (
          <article key={it.title} className="feature-card">
            <div className="cluster">
              {it.icon}
              <h3>{it.title}</h3>
            </div>
            <p>{it.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 7L9 18l-5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Dash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function PricingCompare() {
  // rows: Feature name and availability by plan
  const rows: Array<{ feature: string; starter: boolean | 'dash'; growth: boolean | 'dash'; pro: boolean | 'dash'; note?: string }> = [
    { feature: 'Websites / brands', starter: true, growth: true, pro: true, note: '1 / 3 / Unlimited' },
    { feature: 'Monthly conversations', starter: true, growth: true, pro: true, note: '2k / 10k / 100k+' },
    { feature: 'Email support', starter: true, growth: true, pro: true },
    { feature: 'Chat support', starter: 'dash', growth: true, pro: true },
    { feature: 'Custom workflows & actions', starter: 'dash', growth: true, pro: true },
    { feature: 'Knowledge base sync', starter: 'dash', growth: true, pro: true },
    { feature: 'Shopify / WooCommerce', starter: 'dash', growth: true, pro: true },
    { feature: 'SLA & audit logs', starter: 'dash', growth: 'dash', pro: true },
    { feature: 'SSO (Google / Microsoft)', starter: 'dash', growth: 'dash', pro: true },
    { feature: 'Role-based access', starter: 'dash', growth: 'dash', pro: true },
  ];

  const render = (v: boolean | 'dash') => v === true ? <Check /> : v === false ? null : <Dash />;

  return (
    <section className="container compare">
      <header className="stack" style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2>Compare plans</h2>
        <p className="small">See which plan fits your team best.</p>
      </header>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th className="center">Starter</th>
              <th className="center">Growth</th>
              <th className="center">Pro</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.feature}>
                <td>{r.feature}</td>
                <td className="center">{render(r.starter)}</td>
                <td className="center">{render(r.growth)}</td>
                <td className="center">{render(r.pro)}</td>
                <td>{r.note ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function HowItWorksCircle() {
  // Mobile-friendly, concise copy (works on desktop too)
  const nodes = [
    {
      id: 'snippet',
      x: 110, y: 250, d: '0.15s',
      title: 'Paste one snippet',
      body: 'Install once. No code.'
    },
    {
      id: 'widget',
      x: 340, y: 120, d: '0.25s',
      title: 'Widget goes live',
      body: 'Branded chat bubble, instantly.'
    },
    {
      id: 'ask',
      x: 620, y: 170, d: '0.35s',
      title: 'Customer asks anything',
      body: 'Orders, returns, products, shipping, policies.'
    },
    {
      id: 'understand',
      x: 650, y: 360, d: '0.45s',
      title: 'Understands & finds sources',
      body: 'Detects intent; cites products, orders, and policies.'
    },
    {
      id: 'resolve',
      x: 380, y: 480, d: '0.55s',
      title: 'Resolves with guardrails',
      body: 'Track orders, create RMAs, apply approved discounts.'
    },
    {
      id: 'handoff',
      x: 130, y: 430, d: '0.65s',
      title: 'Handoff & log',
      body: 'Escalate with full context—ticket, SLA, analytics.'
    },
  ];

  const arrows = [
    { d:'0.20s', len: 160, path:'M230 280 C 280 220, 300 200, 340 180' },
    { d:'0.30s', len: 200, path:'M470 160 C 520 150, 570 160, 620 195' },
    { d:'0.40s', len: 120, path:'M690 230 C 695 280, 695 300, 690 340' },
    { d:'0.50s', len: 200, path:'M610 420 C 560 460, 520 480, 470 500' },
    { d:'0.60s', len: 190, path:'M360 525 C 300 510, 260 500, 220 470' },
    { d:'0.70s', len: 110, path:'M180 390 C 175 350, 175 330, 180 300' },
  ];

  return (
    <section id="how-it-works" className="hiw container stack">
      <header className="stack" style={{ textAlign:'center' }}>
        <h2>How it works</h2>
        <p className="small">
          Set it up once. TikoZap handles questions and approved actions—grounded in your store data and policies.
        </p>
      </header>

      <div className="hiwc">
        <svg viewBox="0 0 900 640" role="img" aria-labelledby="hiw-title hiw-desc">
          <title id="hiw-title">How TikoZap works</title>
          <desc id="hiw-desc">
            Six-step circular flow around TikoZap showing setup, questions, understanding, resolution, and handoff.
          </desc>

          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/>
            </marker>
          </defs>

          {/* center bot */}
          <g transform="translate(430,290)" className="center pulse" data-anim="fade" style={{ ['--d' as any]: '.1s' }}>
            <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
              <rect x="2" y="2" width="80" height="80" rx="16" fill="#fff"/>
              <rect x="14" y="22" width="56" height="40" rx="10" fill="none" stroke="currentColor" strokeWidth="2"/>
              <circle cx="32" cy="40" r="5" fill="currentColor"/><circle cx="52" cy="40" r="5" fill="currentColor"/>
              <path d="M 28 52 Q 42 60 56 52" fill="none" stroke="currentColor" strokeWidth="2"/>
              <path d="M 42 10 v 8" stroke="currentColor" strokeWidth="2" />
              <circle cx="42" cy="10" r="3" fill="currentColor"/>
            </svg>
          </g>

          {/* animated arrows */}
          <g stroke="currentColor" fill="none" markerEnd="url(#arrow)">
            {arrows.map((a, i) => (
              <path key={i} d={a.path} className="draw"
                style={{ ['--d' as any]: a.d, ['--len' as any]: `${a.len}` }} />
            ))}
          </g>

          {/* nodes */}
          {nodes.map((n) => (
            <foreignObject key={n.id} x={n.x} y={n.y} width="210" height="120">
              <div className="node" data-anim="fade" style={{ ['--d' as any]: n.d }}>
                <h4>{n.title}</h4>
                <p>{n.body}</p>
              </div>
            </foreignObject>
          ))}
        </svg>

        {/* a11y fallback */}
        <ol className="sr-only">
          <li>Paste one snippet — install once, no code.</li>
          <li>Widget goes live — branded chat bubble, instantly.</li>
          <li>Customer asks anything — orders, returns, products, shipping, policies.</li>
          <li>Understands & finds sources — detects intent and cites products, orders, and policies.</li>
          <li>Resolves with guardrails — track orders, create RMAs, apply approved discounts.</li>
          <li>Handoff & log — escalate with full context; ticket, SLA, analytics.</li>
        </ol>
      </div>
    </section>
  );
}

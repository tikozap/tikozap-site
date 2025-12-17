'use client';

import Link from 'next/link';

const coreFeatures = [
  {
    id: 'ai-support',
    title: '24/7 AI support',
    icon: '⚡️',
    body: 'Instant answers around the clock powered by ChatGPT, your FAQs, and store knowledge—no waiting in line.',
    href: '/docs#ai-support',
  },
  {
    id: 'store-aware',
    title: 'Store-aware answers',
    icon: '🛒',
    body: 'Grounded in your catalog, orders, shipping rules, and policies so replies are always specific to your shop.',
    href: '/docs#store-aware',
  },
  {
    id: 'omnichannel',
    title: 'Omnichannel inbox',
    icon: '💬',
    body: 'One AI agent for your site widget, email, and more, so customers get consistent help wherever they show up.',
    href: '/docs#omnichannel',
  },
  {
    id: 'easy-install',
    title: 'One-click install',
    icon: '🔌',
    body: 'Drop-in script or app install. Connect your store and help center in minutes—no engineering team needed.',
    href: '/docs#easy-install',
  },
  {
    id: 'proactive',
    title: 'Proactive engagement',
    icon: '🎯',
    body: 'Targeted prompts that rescue abandoned carts, answer pre-sale questions, and keep customers moving.',
    href: '/docs#proactive',
  },
  {
    id: 'multilingual',
    title: 'Multilingual & sentiment-aware',
    icon: '🌍',
    body: 'Detects language and mood automatically. Responds kindly in your customer’s preferred language.',
    href: '/docs#multilingual',
  },
  {
    id: 'safe-actions',
    title: 'Safe actions & guardrails',
    icon: '🛡️',
    body: 'Only runs approved workflows—like refunds or discounts—with strong safety filters and data privacy.',
    href: '/docs#safe-actions',
  },
  {
    id: 'handoff',
    title: 'Human handoff',
    icon: '👥',
    body: 'Hand tricky conversations to a human in a click, with full context so no one has to repeat themselves.',
    href: '/docs#handoff',
  },
  {
    id: 'analytics',
    title: 'Analytics & control center',
    icon: '📊',
    body: 'Monitor volume, resolution rate, and satisfaction. Tune rules and responses from one simple dashboard.',
    href: '/docs#analytics',
  },
];

export default function FeaturesPage() {
  return (
    <main id="main" className="features-page">
      {/* Unified page hero: title + one-line subtitle */}
      <section className="page-hero">
        <div className="container">
          <h1>Features</h1>
          <p className="small">
            Everything you need for fast, reliable AI support.
          </p>
        </div>
      </section>

      {/* 9-square feature grid */}
      <section className="features-main">
        <div className="container">
          <div className="features-main__intro">
            <p className="lead">
              Nine core capabilities that make TikoZap feel like a trained support teammate,
              not just another chatbot.
            </p>
            <p className="hint">
              Each tile below links to a short explanation in the docs.
            </p>
          </div>

          <div className="features-grid">
            {coreFeatures.map((feature) => (
              <article key={feature.id} className="feature-card" id={feature.id}>
                <div className="feature-icon" aria-hidden="true">
                  <span>{feature.icon}</span>
                </div>
                <h2 className="feature-title">{feature.title}</h2>
                <p className="feature-body">{feature.body}</p>
                <div className="feature-link-wrap">
                  <Link href={feature.href} className="feature-link">
                    Read the docs →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ——— Tiny inline icons (kept for future use) ——— */
function iconFor(name: string) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as any;

  switch (name) {
    case 'inbox':
      return (
        <svg {...common}>
          <path d="M4 13h4l2 3h4l2-3h4" />
          <path d="M22 13V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6" />
          <path d="M2 13v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          <path d="M8 9h8M8 13h6" />
        </svg>
      );
    case 'flow':
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="18" cy="18" r="3" />
          <path d="M9 6h6M6 9v6a3 3 0 0 0 3 3h6" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...common}>
          <path d="M12 2v6M12 16v6" />
          <path d="M2 12h6M16 12h6" />
          <path d="M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M20 22V5a2 2 0 0 0-2-2H7" />
          <path d="M4 22V4a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case 'mood':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M8 15s1.5 2 4 2 4-2 4-2" />
          <path d="M9 9h.01M15 9h.01" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'handoff':
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
          <path d="M7 9l5-4 5 4M7 15l5 4 5-4" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <rect x="7" y="12" width="3" height="6" />
          <rect x="12" y="8" width="3" height="10" />
          <rect x="17" y="5" width="3" height="13" />
        </svg>
      );
    case 'pulse':
      return (
        <svg {...common}>
          <path d="M3 12h3l3 7 4-14 3 7h5" />
        </svg>
      );
    default:
      return null;
  }
}

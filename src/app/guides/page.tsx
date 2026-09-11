// src/app/guides/page.tsx

import Link from "next/link";

const guides = [
  {
    title: "AI Chatbot vs. AI Customer Service: What’s the Difference?",
    description:
      "Understand the difference between a traditional AI chatbot and broader AI customer service—and what each means for a small business.",
    href: "/guides/ai-chatbot-vs-ai-customer-service",
  },
  {
    title: "Can AI Really Handle Customer Service for a Small Business?",
    description:
      "See what AI customer service can handle well, where human judgment still matters, and how AI can work alongside a small business team.",
    href: "/guides/can-ai-handle-customer-service-for-small-business",
  },
  {
    title: "Is AI Customer Service Safe for a Small Business?",
    description:
      "Learn what small businesses should look for in AI customer service security, privacy, data access, permissions, and human control.",
    href: "/guides/is-ai-customer-service-safe-for-small-business",
  },
];

export default function GuidesPage() {
  return (
    <main className="guides-page">
      <section className="guides-hero">
        <div className="guides-shell">
          <p className="guides-eyebrow">TikoZap Guides</p>

          <h1>Practical answers about AI customer service.</h1>

          <p className="guides-intro">
            Clear, useful guidance for small business owners exploring AI
            customer service, AI assistants, and the future of customer support.
          </p>
        </div>
      </section>

      <section className="guides-library">
        <div className="guides-shell">
          <header className="guides-library-head">
            <h2>Start here</h2>

            <p>
              We answer the questions business owners are asking before they
              trust AI with their customers.
            </p>
          </header>

          <div className="guides-grid">
            {guides.map((guide) => (
              <Link
                href={guide.href}
                className="guide-card guide-card-link"
                key={guide.href}
              >
                <p className="guide-status">Guide</p>
                <h3>{guide.title}</h3>
                <p>{guide.description}</p>
                <span className="guide-read">Read guide →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

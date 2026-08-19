// src/app/dashboard/assistant/page.tsx

import Link from 'next/link';
import MobilePageHeader from '../_components/MobilePageHeader';

const modules = [
  {
    icon: '⭐',
    title: 'Identity',
    description:
      'Name your assistant, choose its job title, greeting, tone, response style, selling style, and voice style.',
    href: '/dashboard/assistant/identity',
    action: 'Meet your assistant',
  },
  {
    icon: '🧪',
    title: 'Test & Coach',
    description:
      'Ask shopper-style questions, review responses, and coach your assistant.',
    href: '/dashboard/assistant/practice',
    action: 'Test & coach your assistant',
  },
  {
    icon: '📓',
    title: 'Memory',
    description:
      "Your assistant's notebook shows what it has learned and remembers about your business.",
    href: '/dashboard/assistant/memory',
    action: 'Open notebook',
  },
];

export default function AssistantPage() {
  return (
    <div className="db-container">
      <MobilePageHeader title="Assistant" />

      <div className="db-pageStack">
        <div className="assistant-hero">
          <div>
            <h1 className="db-title">Assistant</h1>
            <p className="db-sub">
              Help your assistant improve over time.
            </p>
          </div>

          <div className="assistant-heroBadge">
            <span>AI employee</span>
          </div>
        </div>

        <section className="assistant-principle">
          <div className="assistant-principleIcon">✨</div>

          <div>
            <h2>Build a growing store employee, not a chatbot.</h2>
            <p>
  Your assistant has an identity, learns through coaching, and remembers
  what matters.
</p>
          </div>
        </section>

        <div className="assistant-grid">
          {modules.map((item) => (
            <section key={item.title} className="assistant-card">
              <div className="assistant-cardHeading">
                <div className="assistant-cardIcon" aria-hidden="true">
                  {item.icon}
                </div>

                <h2>{item.title}</h2>
              </div>

              <p>{item.description}</p>

              <Link href={item.href} className="assistant-link">
                {item.action}
              </Link>
            </section>
          ))}
        </div>
      </div>

      <style>{`
        .assistant-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .assistant-heroBadge {
          flex: 0 0 auto;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          border-radius: 999px;
          padding: 8px 12px;
          color: #4b5563;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
        }

        .assistant-principle {
          display: grid;
          grid-template-columns: 46px 1fr;
          gap: 14px;
          align-items: start;
          background: #111827;
          color: #ffffff;
          border-radius: 22px;
          padding: 20px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16);
        }

        .assistant-principleIcon {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .assistant-principle h2 {
          margin: 0;
          font-size: 18px;
          line-height: 1.35;
        }

        .assistant-principle p {
          margin: 6px 0 0;
          color: rgba(255, 255, 255, 0.72);
          font-size: 14px;
          line-height: 1.55;
        }

        .assistant-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .assistant-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 18px;
          min-height: 220px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
        }

        .assistant-cardHeading {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .assistant-cardIcon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border-radius: 14px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .assistant-card h2 {
          margin: 0;
          font-size: 18px;
          line-height: 1.25;
          color: #111827;
        }

        .assistant-card p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.55;
        }

        .assistant-link {
          margin-top: auto;
          width: fit-content;
          border-radius: 999px;
          padding: 8px 12px;
          background: #111827;
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
        }

        .assistant-link:hover {
          background: #1f2937;
        }

        @media (max-width: 1200px) {
          .assistant-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 1000px) {
          .assistant-hero {
            padding: 0 12px;
          }

          .assistant-heroBadge {
            display: none;
          }

          .assistant-principle {
            margin: 0 12px;
            grid-template-columns: 1fr;
          }

          .assistant-grid {
            grid-template-columns: 1fr;
            padding: 0 12px 20px;
          }

          .assistant-card {
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
}
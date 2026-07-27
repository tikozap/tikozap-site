// src/app/dashboard/assistant/experience/page.tsx

'use client';

import { useEffect, useState } from 'react';
import AssistantSectionMenu from '../_components/AssistantSectionMenu';
import MobilePageHeader from '../../_components/MobilePageHeader';
import { useAssistantIdentity } from '../_components/useAssistantIdentity';

type ExperienceItem = {
  id: string;
  title: string;
  experience: string;
  result: string;
  conversations: number;
  note: string;
};

const initialExperiences: ExperienceItem[] = [
  {
    id: 'jacket-sizing',
    title: 'Helping customers choose jacket sizes',
    experience:
      "After helping 243 customers choose jackets, I've learned that asking about height and preferred fit before recommending a size leads to much better outcomes.",
    result:
      'This approach has consistently reduced follow-up questions and helped customers feel more confident before buying.',
    conversations: 243,
    note: '',
  },
  {
    id: 'matching-products',
    title: 'Recommending matching products at the right time',
    experience:
      "After helping 186 customers compare outfits, I've learned that recommending matching items works best after first understanding the customer's style goal.",
    result:
      'This makes recommendations feel helpful instead of pushy, especially for customers shopping for gifts or events.',
    conversations: 186,
    note: '',
  },
  {
    id: 'shipping-confidence',
    title: 'Helping customers feel confident about delivery timing',
    experience:
      "After answering 152 shipping questions, I've learned to explain delivery timing more clearly by asking when the customer needs the item.",
    result:
      'This helps customers decide whether standard shipping is enough or if they should choose a faster option.',
    conversations: 152,
    note: '',
  },
];

export default function ExperiencePage() {
  const { assistantName } = useAssistantIdentity();
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);

useEffect(() => {
  async function loadExperiences() {
    const res = await fetch('/api/emma-growth/experience', {
      cache: 'no-store',
    });

    const data = await res.json();

    const items: ExperienceItem[] = (data.cards || []).map((card: any) => ({
      id: card.id,
      title: card.title,
      experience: card.message,
      result: card.result,
      conversations: card.appliedCount,
      note: '',
    }));

    setExperiences(items);
  }

  loadExperiences().catch((err) => {
    console.error('[Experience] Failed to load Emma experience cards', err);
  });
}, []);

  function updateNote(id: string, note: string) {
    setExperiences((items) =>
      items.map((item) => (item.id === id ? { ...item, note } : item)),
    );
  }

  function encourageEmma(id: string) {
    setExperiences((items) => items.filter((item) => item.id !== id));
  }

  return (
    <div className="db-container">
      <MobilePageHeader
  title="Experience"
  rightAction={<AssistantSectionMenu />}
/>

      <div className="db-pageStack ex-page">
<div className="assistant-sectionPageHeader">
  <div>
    <h1 className="db-title">Experience</h1>
    <p className="db-sub">
      See how your assistant grows through real customer conversations.
    </p>
  </div>

  <div className="assistant-sectionDesktopSwitcher">
    <AssistantSectionMenu />
  </div>
</div>

        {experiences.length === 0 ? (
          <section className="ex-empty">
            <div className="ex-emptyIcon">⭐</div>
            <h2>Nothing new to share today.</h2>
            <p>
              I&apos;ll keep learning from real customer conversations and share
              meaningful growth when I have enough experience.
            </p>
          </section>
        ) : (
          <div className="ex-list">
            {experiences.map((item) => (
              <section key={item.id} className="ex-card">
                <div className="ex-cardTop">
                  <div className="ex-icon">⭐</div>
                  <div>
                    <h2>I&apos;d like to share something from my experience.</h2>
                    <p>Based on {item.conversations} customer conversations.</p>
                  </div>
                </div>

                <div className="ex-experience">
                  <h3>{item.title}</h3>
                  <p>{item.experience}</p>
                  <p className="ex-result">{item.result}</p>
                </div>

<div className="ex-thread">
  <div className="ex-threadComposer">
    <textarea placeholder={`Reply to ${assistantName}...`} />
    <button type="button">↑</button>
  </div>

  <p className="ex-threadHint">
    If you don&apos;t respond, I&apos;ll continue using this approach.
  </p>
</div>
              </section>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .ex-page {
          max-width: 760px;
          margin: 0 auto;
        }

        .ex-list {
          display: grid;
          gap: 14px;
        }

        .ex-card,
        .ex-empty {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
        }

        .ex-card {
          display: grid;
          gap: 16px;
        }

        .ex-cardTop {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ex-icon,
        .ex-emptyIcon {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex: 0 0 auto;
        }

        .ex-cardTop h2 {
          margin: 0;
          color: #111827;
          font-size: 18px;
          line-height: 1.25;
        }

        .ex-cardTop p {
          margin: 4px 0 0;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.4;
        }

        .ex-experience {
          color: #111827;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 14px;
        }

        .ex-experience h3 {
          margin: 0 0 10px;
          color: #111827;
          font-size: 17px;
          line-height: 1.35;
        }

        .ex-experience p {
          margin: 0;
          color: #111827;
          font-size: 15px;
          font-weight: 650;
          line-height: 1.6;
        }

        .ex-result {
          margin-top: 12px !important;
          color: #475569 !important;
          font-weight: 500 !important;
        }

        .ex-note {
          display: grid;
          gap: 8px;
        }

        .ex-note span {
          color: #475569;
          font-size: 12px;
          font-weight: 900;
        }

        .ex-note em {
          color: #94a3b8;
          font-style: normal;
          font-weight: 800;
        }

        .ex-note textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          background: #ffffff;
          border-radius: 14px;
          padding: 12px;
          font-size: 14px;
          color: #111827;
          outline: none;
          min-height: 88px;
          resize: vertical;
          line-height: 1.5;
        }

        .ex-note textarea:focus {
          border-color: #111827;
        }

        .ex-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ex-primary {
          border: none;
          background: #111827;
          color: #ffffff;
          border-radius: 14px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .ex-helper {
          margin: -6px 0 0;
          color: #9ca3af;
          font-size: 12px;
          line-height: 1.45;
        }

        .ex-empty {
          text-align: center;
          display: grid;
          justify-items: center;
          gap: 8px;
          padding: 36px 18px;
        }

        .ex-empty h2 {
          margin: 0;
          color: #111827;
          font-size: 22px;
          letter-spacing: -0.02em;
        }

        .ex-empty p {
          margin: 0;
          max-width: 430px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.55;
        }

.ex-thread {
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
  display: grid;
  gap: 8px;
}

.ex-threadComposer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: end;
}

.ex-threadComposer textarea {
  min-height: 48px;
  resize: vertical;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}

.ex-threadComposer button {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.ex-threadHint {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.assistant-sectionPageHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.assistant-sectionDesktopSwitcher {
  flex: 0 0 auto;
}

@media (max-width: 900px) {
  .assistant-sectionDesktopSwitcher {
    display: none;
  }
}

        @media (max-width: 900px) {
          .db-pageStack.ex-page {
            padding: 0 12px 24px;
          }

          .ex-cardTop {
            align-items: flex-start;
          }

          .ex-actions {
            display: grid;
          }

          .ex-primary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
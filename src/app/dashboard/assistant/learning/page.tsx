// src/app/dashboard/assistant/learning/page.tsx

'use client';

import { useEffect, useState } from 'react';
import AssistantSectionMenu from '../_components/AssistantSectionMenu';
import MobilePageHeader from '../../_components/MobilePageHeader';
import { useAssistantIdentity } from '../_components/useAssistantIdentity';

type LearningItem = {
  id: string;
  observation: string;
  understanding: string;
  conversations: number;
  guidance: string;
};

type ApiLearningCard = {
  id: string;
  title: string;
  message: string;
  currentUnderstanding: string;
  question: string;
  occurrences: number;
  confidence: number;
};

export default function LearningBankPage() {
  const { assistantName } = useAssistantIdentity();
  const [learnings, setLearnings] = useState<LearningItem[]>([]);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [thread, setThread] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [loadingThread, setLoadingThread] = useState(false);

useEffect(() => {
  async function loadLearnings() {
    const res = await fetch('/api/emma-growth/learning', {
      cache: 'no-store',
    });

    const data = await res.json();

    const items: LearningItem[] = (data.cards || []).map(
      (card: ApiLearningCard) => ({
        id: card.id,
        observation: card.message,
        understanding: card.currentUnderstanding,
        conversations: card.occurrences,
        guidance: '',
      }),
    );

    setLearnings(items);
    if (items[0]) {
  openConversation(items[0]);
}
  }

  loadLearnings().catch((err) => {
    console.error('[Learning] Failed to load Emma learning cards', err);
  });
}, []);

async function openConversation(item: LearningItem) {
  setLoadingThread(true);

  try {
    const res = await fetch('/api/assistant/mentoring/thread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: 'test-tenant',
        observationId: item.id,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error(data.error);
      return;
    }

    setOpenThreadId(item.id);
    setThread(data.thread);
  } finally {
    setLoadingThread(false);
  }
}

async function sendReply() {
  const text = reply.trim();

  if (!text || !thread) return;

  const res = await fetch('/api/assistant/mentoring/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      threadId: thread.id,
      content: text,
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    console.error(data.error);
    return;
  }

  setThread(data.thread);
  setReply('');
}

  function updateGuidance(id: string, guidance: string) {
    setLearnings((items) =>
      items.map((item) => (item.id === id ? { ...item, guidance } : item)),
    );
  }

  function completeLearning(id: string) {
    setLearnings((items) => items.filter((item) => item.id !== id));
  }

  function dismissLearning(id: string) {
    setLearnings((items) => items.filter((item) => item.id !== id));
  }

  return (
    <div className="db-container">
      <MobilePageHeader
  title="Learning"
  rightAction={<AssistantSectionMenu />}
/>

      <div className="db-pageStack lb-page">
      <div className="assistant-sectionPageHeader">
        <div>
          <h1 className="db-title">Learning</h1>
          <p className="db-sub">
            A mentoring session between you and your AI employee.
          </p>
        </div>

  <div className="assistant-sectionDesktopSwitcher">
    <AssistantSectionMenu />
  </div>
</div>

        {learnings.length === 0 ? (
          <section className="lb-empty">
            <div className="lb-emptyIcon">📚</div>
            <h2>Nothing new today.</h2>
            <p>
              I&apos;ll keep listening to customer conversations and let you know
              when I discover something worth learning.
            </p>


          </section>
        ) : (
          <div className="lb-list">
            {learnings.map((item) => (
              <section key={item.id} className="lb-card">
                <div className="lb-cardTop">
                  <div className="lb-icon">💡</div>
                  <div>
                    <h2>{item.observation}</h2>
                    <p>Observed in {item.conversations} conversations.</p>
                  </div>
                </div>

<div className="lb-observation">
  <p>{item.understanding}</p>
  <p className="lb-understanding">
    Am I understanding your business correctly?
  </p>
</div>

{openThreadId === item.id && thread ? (
  <div className="lb-thread">
    {thread.messages
      .filter((msg: any, index: number) => index !== 0)
      .map((msg: any) => (
        <div
          key={msg.id}
          className={
            msg.role === 'emma'
              ? 'lb-threadMsg lb-emmaMsg'
              : 'lb-threadMsg lb-merchantMsg'
          }
        >
          <strong>{msg.role === 'emma' ? assistantName : 'You'}</strong>
          <p>{msg.content}</p>
        </div>
      ))}

    <div className="lb-threadComposer">
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder={`Reply to ${assistantName}...`}
      />
      <button type="button" onClick={sendReply}>
        ↑
      </button>
    </div>
    <p className="lb-threadHint">
  If you don&apos;t respond, I&apos;ll continue with my current understanding.
</p>
  </div>
) : null}
              </section>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .lb-page {
          max-width: 760px;
          margin: 0 auto;
        }

        .lb-list {
          display: grid;
          gap: 14px;
        }

        .lb-card,
        .lb-empty {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
        }

        .lb-card {
          display: grid;
          gap: 16px;
        }

        .lb-cardTop {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lb-icon,
        .lb-emptyIcon {
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

        .lb-cardTop h2 {
          margin: 0;
          color: #111827;
          font-size: 18px;
          line-height: 1.25;
        }

        .lb-cardTop p {
          margin: 4px 0 0;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.4;
        }

        .lb-observation {
          color: #111827;
          font-size: 17px;
          font-weight: 850;
          line-height: 1.45;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 14px;
        }

        .lb-guidance {
          display: grid;
          gap: 8px;
        }

        .lb-guidance span {
          color: #475569;
          font-size: 12px;
          font-weight: 900;
        }

        .lb-guidance textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          background: #ffffff;
          border-radius: 14px;
          padding: 12px;
          font-size: 12px;
          color: #9ca3af
          outline: none;
          min-height: 96px;
          resize: vertical;
          line-height: 1.5;
        }

        .lb-guidance textarea:focus {
          border-color: #111827;
        }

        .lb-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .lb-primary,
        .lb-secondary {
          border-radius: 14px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .lb-primary {
          border: none;
          background: #111827;
          color: #ffffff;
        }

        .lb-secondary {
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #475569;
        }

        .lb-empty {
          text-align: center;
          display: grid;
          justify-items: center;
          gap: 8px;
          padding: 36px 18px;
        }

        .lb-empty h2 {
          margin: 0;
          color: #111827;
          font-size: 22px;
          letter-spacing: -0.02em;
        }

        .lb-empty p {
          margin: 0;
          max-width: 430px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.55;
        }

.lb-observation p {
  margin: 0;
}

.lb-understanding {
  margin-top: 12px !important;
  color: #475569;
  font-weight: 500;
  line-height: 1.6;
}

.lb-note {
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.45;
}

.lb-thread {
  margin-top: 14px;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
  display: grid;
  gap: 12px;
}

.lb-threadMsg {
  max-width: 82%;
  border-radius: 16px;
  padding: 12px 14px;
  white-space: pre-wrap;
}

.lb-emmaMsg {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  justify-self: start;
}

.lb-merchantMsg {
  background: #111827;
  color: #fff;
  justify-self: end;
}

.lb-threadMsg strong {
  display: block;
  font-size: 12px;
  margin-bottom: 5px;
}

.lb-threadMsg p {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
}

.lb-threadComposer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: end;
}

.lb-threadComposer textarea {
  min-height: 44px;
  resize: vertical;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 10px 12px;
  font-size: 14px;
}

.lb-threadComposer button {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.lb-threadHint {
  margin: -4px 0 0;
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
          .db-pageStack.lb-page {
            padding: 0 12px 24px;
          }

          .lb-cardTop {
            align-items: flex-start;
          }

          .lb-actions {
            display: grid;
          }

          .lb-primary,
          .lb-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
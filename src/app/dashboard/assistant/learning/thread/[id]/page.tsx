// src/app/dashboard/assistant/learning/thread/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import MobilePageHeader from '../../../../_components/MobilePageHeader';

type MentoringMessage = {
  id: string;
  role: 'emma' | 'merchant';
  content: string;
  createdAt: string;
};

type MentoringThread = {
  id: string;
  title: string;
  status: string;
  messages: MentoringMessage[];
};

export default function MentoringThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const [thread, setThread] = useState<MentoringThread | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function loadThread() {
    const res = await fetch(`/api/assistant/mentoring/thread/${params.id}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    setThread(data.thread);
  }

  async function sendMessage() {
    const text = message.trim();
    if (!text || sending) return;

    setSending(true);
    setMessage('');

    const res = await fetch('/api/assistant/mentoring/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: params.id, content: text }),
    });

    const data = await res.json();
    setThread(data.thread);
    setSending(false);
  }

  useEffect(() => {
    loadThread().catch(console.error);
  }, []);

  return (
    <div className="db-container">
      <MobilePageHeader title="Learning" />

      <div className="db-pageStack mt-page">
        <div>
          <h1 className="db-title">Learning</h1>
          <p className="db-sub">A mentoring conversation with Emma.</p>
        </div>

        <section className="mt-card">
          <div className="mt-thread">
            {thread?.messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.role === 'emma' ? 'mt-msg mt-emma' : 'mt-msg mt-merchant'
                }
              >
                <div className="mt-name">
                  {msg.role === 'emma' ? 'Emma' : 'You'}
                </div>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-composer">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Reply to Emma..."
            />
            <button type="button" onClick={sendMessage} disabled={sending}>
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </section>
      </div>

      <style jsx>{`
        .mt-page {
          max-width: 760px;
          margin: 0 auto;
        }

        .mt-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
        }

        .mt-thread {
          display: grid;
          gap: 14px;
        }

        .mt-msg {
          max-width: 82%;
          border-radius: 18px;
          padding: 14px;
          white-space: pre-wrap;
        }

        .mt-emma {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          justify-self: start;
        }

        .mt-merchant {
          background: #111827;
          color: #fff;
          justify-self: end;
        }

        .mt-name {
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 6px;
          opacity: 0.75;
        }

        .mt-msg p {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
        }

        .mt-composer {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: end;
        }

        .mt-composer textarea {
          min-height: 78px;
          resize: vertical;
          border: 1px solid #d1d5db;
          border-radius: 14px;
          padding: 12px;
          font-size: 14px;
          outline: none;
        }

        .mt-composer button {
          border: none;
          border-radius: 14px;
          padding: 12px 16px;
          background: #111827;
          color: #fff;
          font-weight: 900;
          cursor: pointer;
        }

        .mt-composer button:disabled {
          opacity: 0.6;
          cursor: default;
        }

        @media (max-width: 900px) {
          .db-pageStack.mt-page {
            padding: 0 12px 24px;
          }

          .mt-msg {
            max-width: 100%;
          }

          .mt-composer {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
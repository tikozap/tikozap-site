// src/app/dashboard/_components/DashboardAskTiko.tsx

'use client';

import { useEffect, useState } from 'react';

const exampleQuestions = [
  'What should I do first?',
  'How do I train my assistant?',
  'Where do I see customer messages?',
  'How do I set up my Widget?',
  'What is Starter Link?',
];

type AskTikoMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function DashboardAskTiko() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] =
    useState<AskTikoMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function startNewChat() {
  setMessages([]);
  setDraft('');
  setError('');
}

  async function sendMessage(
  value?: string
) {
  const message =
    String(value ?? draft).trim();

  if (!message || sending) return;

  const userMessage: AskTikoMessage = {
    role: 'user',
    content: message,
  };

  const nextMessages = [
    ...messages,
    userMessage,
  ];

  setMessages(nextMessages);
  setDraft('');
  setSending(true);
  setError('');

  try {
    const res = await fetch(
      '/api/dashboard/tiko',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: messages,
        }),
      }
    );

    const data =
      await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      throw new Error(
        data?.error ||
          'Could not reach Tiko.'
      );
    }

    setMessages([
      ...nextMessages,
      {
        role: 'assistant',
        content: String(
          data.answer || ''
        ).trim(),
      },
    ]);
  } catch (err: any) {
    setError(
      err?.message ||
        'Could not reach Tiko.'
    );
  } finally {
    setSending(false);
  }
}

  return (
    <>
{!open ? (
  <button
    type="button"
    className="db-askTikoButton"
    onClick={() => setOpen(true)}
    aria-label="Ask Tiko"
  >
    <span className="db-askTikoLabel">Ask Tiko</span>
  </button>
) : null}

      {open ? (
        <>
          <button
            type="button"
            className="db-askTikoScrim"
            aria-label="Close Ask Tiko"
            onClick={() => setOpen(false)}
          />

          <aside
            className="db-askTikoPanel"
            aria-label="Ask Tiko"
          >
            <div className="db-askTikoHead">
              <div>
                <strong>Ask Tiko</strong>
                <p>
                  I can help you use your Dashboard.
                </p>
              </div>

<div className="db-askTikoHeadActions">
  {messages.length > 0 ? (
    <button
      type="button"
      className="db-askTikoNewChat"
      onClick={startNewChat}
    >
      New chat
    </button>
  ) : null}

  <button
    type="button"
    className="db-askTikoClose"
    aria-label="Close Ask Tiko"
    onClick={() => setOpen(false)}
  >
    ×
  </button>
</div>
            </div>

<div className="db-askTikoBody">
  {messages.length === 0 ? (
    <>
      <div className="db-askTikoIntro">
        <strong>Try asking:</strong>
      </div>

      <div className="db-askTikoExamples">
        {exampleQuestions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={sending}
            onClick={() =>
              void sendMessage(question)
            }
          >
            {question}
          </button>
        ))}
      </div>
    </>
  ) : (
    <div className="db-askTikoMessages">
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={[
            'db-askTikoMessage',
            message.role === 'user'
              ? 'is-user'
              : 'is-tiko',
          ].join(' ')}
        >
          {message.content}
        </div>
      ))}

      {sending ? (
        <div className="db-askTikoMessage is-tiko">
          Thinking…
        </div>
      ) : null}

      {error ? (
        <div className="db-askTikoError">
          {error}
        </div>
      ) : null}
    </div>
  )}
</div>

            <div className="db-askTikoComposer">
<textarea
  value={draft}
  onChange={(event) =>
    setDraft(event.target.value)
  }
  placeholder="Ask about your Dashboard..."
  rows={1}
  disabled={sending}
  onKeyDown={(event) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();
      void sendMessage();
    }
  }}
/>

<button
  type="button"
  className="db-askTikoSend"
  disabled={
    !draft.trim() ||
    sending
  }
  aria-label="Send"
  onClick={() => void sendMessage()}
>
  ↑
</button>
            </div>
          </aside>
        </>
      ) : null}

      <style jsx global>{`
        .db-askTikoButton {
          position: fixed;
          top: 18px;
          right: 20px;
          z-index: 55;
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          background: #ffffff;
          color: #111827;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
          cursor: pointer;
        }

        .db-askTikoButton:hover {
          background: #f8fafc;
        }

        .db-askTikoScrim {
          position: fixed;
          inset: 0;
          z-index: 109;
          border: 0;
          padding: 0;
          background: rgba(15, 23, 42, 0.18);
        }

        .db-askTikoPanel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 110;
          width: min(390px, 92vw);
          background: #ffffff;
          border-left: 1px solid #e5e7eb;
          box-shadow: -10px 0 30px rgba(15, 23, 42, 0.12);
          display: grid;
          grid-template-rows: auto minmax(0, 1fr) auto;
        }

        .db-askTikoHead {
          min-height: 76px;
          padding: 18px 18px 14px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .db-askTikoHead strong {
          display: block;
          font-size: 17px;
          color: #111827;
        }

        .db-askTikoHead p {
          margin: 4px 0 0;
          font-size: 13px;
          line-height: 1.45;
          color: #64748b;
        }

        .db-askTikoClose {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #64748b;
          font-size: 25px;
          line-height: 1;
          cursor: pointer;
        }

        .db-askTikoClose:hover {
          background: #f1f5f9;
          color: #111827;
        }

.db-askTikoHeadActions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.db-askTikoNewChat {
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 8px;
  border-radius: 8px;
  cursor: pointer;
}

.db-askTikoNewChat:hover {
  background: #f1f5f9;
  color: #111827;
}
        .db-askTikoBody {
          min-height: 0;
          overflow-y: auto;
          padding: 20px 18px;
        }

        .db-askTikoIntro {
          margin-bottom: 10px;
          font-size: 13px;
          color: #64748b;
        }

        .db-askTikoExamples {
          display: grid;
          gap: 8px;
        }

        .db-askTikoExamples button {
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          color: #334155;
          text-align: left;
          font-size: 13px;
          line-height: 1.4;
          cursor: pointer;
        }

        .db-askTikoExamples button:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }

        .db-askTikoComposer {
          padding: 12px;
          border-top: 1px solid #e5e7eb;
          background: #ffffff;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 42px;
          gap: 8px;
          align-items: end;
        }

        .db-askTikoComposer textarea {
          width: 100%;
          min-height: 42px;
          max-height: 120px;
          resize: none;
          border: 1px solid #d1d5db;
          border-radius: 13px;
          padding: 10px 12px;
          font: inherit;
          font-size: 14px;
          line-height: 1.45;
          color: #111827;
          background: #ffffff;
          outline: none;
          box-sizing: border-box;
        }

        .db-askTikoComposer textarea:focus {
          border-color: #94a3b8;
        }

        .db-askTikoSend {
          width: 42px;
          height: 42px;
          border: 0;
          border-radius: 12px;
          background: #111827;
          color: #ffffff;
          font-size: 19px;
          cursor: pointer;
        }

        .db-askTikoSend:disabled {
          opacity: 0.35;
          cursor: default;
        }

.db-askTikoMessages {
  display: grid;
  gap: 10px;
}

.db-askTikoMessage {
  max-width: 86%;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.db-askTikoMessage.is-user {
  justify-self: end;
  background: #111827;
  color: #ffffff;
}

.db-askTikoMessage.is-tiko {
  justify-self: start;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
}

.db-askTikoError {
  padding: 9px 10px;
  border-radius: 10px;
  background: #fef2f2;
  color: #991b1b;
  font-size: 12px;
}

@media (max-width: 1000px) {
  .db-askTikoButton {
    top: 8px;
    right: 16px;
    z-index: 120;
    width: auto;
    height: 48px;
    min-height: 48px;
    padding: 0 6px;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    font-size: 13px;
  }

  .db-askTikoLabel {
    display: inline;
  }

  .db-askTikoPanel {
    width: min(390px, 100vw);
  }

  .db-askTikoClose {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
  }

  .db-askTikoHead {
    padding-right: 14px;
  }
}
      `}</style>
    </>
  );
}
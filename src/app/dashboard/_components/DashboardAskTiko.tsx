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

export default function DashboardAskTiko() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

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

              <button
                type="button"
                className="db-askTikoClose"
                aria-label="Close Ask Tiko"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="db-askTikoBody">
              <div className="db-askTikoIntro">
                <strong>Try asking:</strong>
              </div>

              <div className="db-askTikoExamples">
                {exampleQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => setDraft(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            <div className="db-askTikoComposer">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about your Dashboard..."
                rows={1}
              />

              <button
                type="button"
                className="db-askTikoSend"
                disabled
                aria-label="Send"
                title="Tiko conversation will be connected next"
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
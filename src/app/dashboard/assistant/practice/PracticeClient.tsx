// src/app/dashboard/assistant/practice/PracticeClient.tsx

'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import MobilePageHeader from '../../_components/MobilePageHeader';
import AssistantSectionMenu from '../_components/AssistantSectionMenu';
import { useAssistantIdentity } from '../_components/useAssistantIdentity';

type PracticeMode = 'ask' | 'coach';

type PracticeMessage = {
  id: string;
  role: 'merchant' | 'assistant';
  kind: 'question' | 'answer' | 'coaching' | 'acknowledgement';
  content: string;
  question?: string;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function PracticeClient() {
  const [messages, setMessages] = useState<PracticeMessage[]>([]);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<PracticeMode>('ask');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [coachingQuestion, setCoachingQuestion] = useState('');
  const { assistantName } = useAssistantIdentity();

  const safeAssistantName =
    String(assistantName || '').trim() || 'Assistant';

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const [teachText, setTeachText] = useState('');
  const [teachReply, setTeachReply] = useState('');

  useEffect(() => {
  if (busy) return;

  window.setTimeout(() => {
    composerRef.current?.focus();
  }, 0);
}, [busy, mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [messages, busy]);

function beginCoaching(question: string) {
  setCoachingQuestion(question);
  setMode('coach');
  setText('');
  setError('');

  window.setTimeout(() => {
    composerRef.current?.focus();
  }, 0);
}

  function cancelCoaching() {
    setMode('ask');
    setText('');
    setError('');
    setCoachingQuestion('');

    window.setTimeout(() => {
      composerRef.current?.focus();
    }, 0);
  }

  async function sendQuestion() {
    const question = text.trim();

    if (!question || busy) return;

    const history = messages
      .filter(
        (message) =>
          message.kind === 'question' ||
          message.kind === 'answer'
      )
      .map((message) => ({
        role:
          message.role === 'merchant'
            ? ('customer' as const)
            : ('assistant' as const),
        content: message.content,
      }));

    const merchantMessage: PracticeMessage = {
      id: createMessageId(),
      role: 'merchant',
      kind: 'question',
      content: question,
    };

    setMessages((current) => [...current, merchantMessage]);
    setText('');
    setError('');
    setBusy(true);

    try {
      const response = await fetch('/api/widget/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          text: question,
          history,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error || 'Could not ask the assistant.'
        );
      }

      const assistantMessage: PracticeMessage = {
        id: createMessageId(),
        role: 'assistant',
        kind: 'answer',
        content: String(data.reply || '').trim(),
        question,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (caughtError: any) {
      setError(
        caughtError?.message || 'Could not ask the assistant.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendCoaching() {
    const guidance = text.trim();

    if (!guidance || busy) return;

    const coachingMessage: PracticeMessage = {
      id: createMessageId(),
      role: 'merchant',
      kind: 'coaching',
      content: guidance,
    };

    setMessages((current) => [...current, coachingMessage]);
    setText('');
    setError('');
    setBusy(true);

    try {
      const response = await fetch(
        '/api/assistant/practice/coach',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
body: JSON.stringify({
  guidance,
  question: coachingQuestion,
}),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error || 'Could not coach the assistant.'
        );
      }

      const acknowledgementMessage: PracticeMessage = {
        id: createMessageId(),
        role: 'assistant',
        kind: 'acknowledgement',
        content: String(data.reply || '').trim(),
      };

      setMessages((current) => [
        ...current,
        acknowledgementMessage,
      ]);

      setMode('ask');
    } catch (caughtError: any) {
      setError(
        caughtError?.message ||
          'Could not coach the assistant.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function teachAssistant() {
  const instruction = teachText.trim();

  if (!instruction || busy) return;

  setBusy(true);
  setError('');
  setTeachReply('');

  try {
    const response = await fetch('/api/assistant/memory', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        instruction,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      throw new Error(
        data?.error || 'Could not teach the assistant.'
      );
    }

    if (data?.reply) {
      setTeachReply(String(data.reply));
    }

    setTeachText('');
  } catch (caughtError: any) {
    setError(
      caughtError?.message ||
        'Could not teach the assistant.'
    );
  } finally {
    setBusy(false);
  }
}

  async function sendCurrentMessage() {
    if (mode === 'coach') {
      await sendCoaching();
      return;
    }

    await sendQuestion();
  }

  function handleComposerKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key !== 'Enter' || event.shiftKey) return;

    event.preventDefault();
    void sendCurrentMessage();
  }

return (
  <div>
    <MobilePageHeader title="Test & Teach" />

    <div className="practice-page">
      <div className="practice-top">
        <div>
          <h1 className="db-title">Test &amp; Teach</h1>

          <p className="db-sub">
            Test {safeAssistantName}, coach incorrect answers, and teach new knowledge.
          </p>
        </div>

        <AssistantSectionMenu />
      </div>

      <section
  className={[
    'practice-card',
    messages.length === 0 ? 'is-empty' : '',
  ]
    .filter(Boolean)
    .join(' ')}
>
        <div className="practice-header">
          <div>
            <div className="practice-title">
              Test {assistantName}
            </div>

            <div className="practice-description">
              Ask a question as the merchant. When an answer is
              incorrect, coach {safeAssistantName} directly.
            </div>
          </div>

          {messages.length > 0 ? (
            <button
              type="button"
              className="db-btn"
              disabled={busy}
              onClick={() => {
                setMessages([]);
                setText('');
                setMode('ask');
                setError('');
              }}
            >
              Start over
            </button>
          ) : null}
        </div>

{messages.length > 0 ? (
  <div className="practice-conversation">
    {messages.map((message) => {
      const isMerchant = message.role === 'merchant';
      const isCoaching = message.kind === 'coaching';
      const isAnswer = message.kind === 'answer';

      return (
        <div
          key={message.id}
          className={[
            'practice-messageRow',
            isMerchant ? 'is-merchant' : 'is-assistant',
          ].join(' ')}
        >
          <div className="practice-messageWrap">
            <div className="practice-messageLabel">
              {isMerchant
                ? isCoaching
                  ? `You coached ${assistantName}`
                  : 'You'
                : assistantName}
            </div>

            <div
              className={[
                'practice-messageBubble',
                isMerchant ? 'is-merchant' : 'is-assistant',
                isCoaching ? 'is-coaching' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {message.content}
            </div>

            {isAnswer ? (
              <button
                type="button"
                className="practice-coachButton"
                disabled={busy}
                onClick={() =>
                  beginCoaching(message.question || '')
                }
              >
                Coach {safeAssistantName}
              </button>
            ) : null}
          </div>
        </div>
      );
    })}

    {busy ? (
      <div className="practice-messageRow is-assistant">
        <div className="practice-messageWrap">
          <div className="practice-messageLabel">
            {assistantName}
          </div>

          <div className="practice-messageBubble is-assistant is-thinking">
            {mode === 'coach'
              ? 'Learning…'
              : 'Thinking…'}
          </div>
        </div>
      </div>
    ) : null}

    <div ref={messagesEndRef} />
  </div>
) : null}

        <div
          className={[
            'practice-composer',
            mode === 'coach' ? 'is-coaching' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {mode === 'coach' ? (
            <div className="practice-coachingBanner">
              <div>
                <strong>Coach {safeAssistantName}</strong>
                <span>
                  Tell {safeAssistantName} what to remember for future
                  conversations.
                </span>
              </div>

              <button
                type="button"
                onClick={cancelCoaching}
                disabled={busy}
                aria-label="Cancel coaching"
              >
                ×
              </button>
            </div>
          ) : null}

          <textarea
            ref={composerRef}
            value={text}
            disabled={busy}
            rows={2}
placeholder={
  mode === 'coach'
    ? `Coach ${assistantName}...`
    : messages.length === 0
      ? `Start a test conversation by asking ${assistantName}...`
      : `Ask ${assistantName}...`
}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleComposerKeyDown}
          />

          {error ? (
            <div className="practice-error">{error}</div>
          ) : null}

          <div className="practice-composerActions">
            <span>
              Press Enter to send · Shift + Enter for a new line
            </span>

<button
  type="button"
  className={[
    'db-btn',
    mode === 'coach' ? '' : 'primary',
  ]
    .filter(Boolean)
    .join(' ')}
  disabled={busy || !text.trim()}
  onClick={() => {
    void sendCurrentMessage();
  }}
>
              {busy
                ? mode === 'coach'
                  ? 'Saving…'
                  : 'Sending…'
                : mode === 'coach'
                  ? `Coach ${assistantName}`
                  : 'Send'}
            </button>
          </div>
        </div>
      </section>

      <section className="practice-teachCard">
  <div>
    <h2>Teach {safeAssistantName}</h2>

    <p>
      Add something {safeAssistantName} should remember for future
      customer conversations.
    </p>
  </div>

  <textarea
    value={teachText}
    rows={4}
    disabled={busy}
    placeholder={`What should ${safeAssistantName} remember?`}
    onChange={(event) => {
      setTeachText(event.target.value);
      setTeachReply('');
    }}
  />

  {teachReply ? (
    <div className="practice-teachReply">
      {teachReply}
    </div>
  ) : null}

<div className="practice-teachActions">
  {teachText ? (
    <button
      type="button"
      className="db-btn"
      disabled={busy}
      onClick={() => {
        setTeachText('');
        setTeachReply('');
      }}
    >
      Clear
    </button>
  ) : null}

  <button
    type="button"
    className="db-btn primary"
    disabled={busy || !teachText.trim()}
    onClick={() => {
      void teachAssistant();
    }}
  >
    {busy ? 'Teaching…' : 'Teach'}
  </button>
</div>
</section>
      </div>

      <style jsx>{`
        .practice-page {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
        }

        .practice-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .practice-card {
          min-height: 640px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 8px 30px rgba(15, 23, 42, 0.05);
        }

        .practice-card.is-empty {
          min-height: 0;
        }

        .practice-header {
          min-height: 84px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .practice-title {
          color: #111827;
          font-size: 15px;
          font-weight: 850;
        }

        .practice-description {
          margin-top: 5px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .practice-conversation {
          height: 430px;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 22px;
          background: #f8fafc;
        }

        .practice-empty {
          min-height: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
        }

        .practice-emptyIcon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #ffffff;
          font-size: 23px;
        }

        .practice-emptyTitle {
          margin-top: 14px;
          color: #111827;
          font-size: 15px;
          font-weight: 800;
        }

        .practice-emptyText {
          max-width: 390px;
          margin-top: 7px;
          font-size: 13px;
          line-height: 1.55;
        }

        .practice-messageRow {
          display: flex;
          margin-bottom: 16px;
        }

        .practice-messageRow.is-merchant {
          justify-content: flex-end;
        }

        .practice-messageRow.is-assistant {
          justify-content: flex-start;
        }

        .practice-messageWrap {
          width: min(78%, 680px);
        }

        .practice-messageLabel {
          margin-bottom: 5px;
          color: #64748b;
          font-size: 11px;
          font-weight: 750;
        }

        .practice-messageRow.is-merchant
          .practice-messageLabel {
          text-align: right;
        }

        .practice-messageBubble {
          border-radius: 15px;
          padding: 11px 13px;
          font-size: 13px;
          line-height: 1.55;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .practice-messageBubble.is-merchant {
          border: 1px solid #111827;
          background: #111827;
          color: #ffffff;
        }

        .practice-messageBubble.is-assistant {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #111827;
        }

        .practice-messageBubble.is-coaching {
          border-color: #f4c84a;
          background: #fffbeb;
          color: #78350f;
        }

        .practice-messageBubble.is-thinking {
          color: #64748b;
        }

        .practice-coachButton {
          margin-top: 7px;
          border: none;
          background: transparent;
          color: #475569;
          padding: 2px 0;
          font: inherit;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
        }

        .practice-coachButton:hover {
          color: #111827;
          text-decoration: underline;
        }

        .practice-coachButton:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .practice-composer {
          padding: 16px 18px 18px;
          border-top: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .practice-composer.is-coaching {
          background: #fffdf5;
        }

        .practice-coachingBanner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
          border: 1px solid #f4d56b;
          border-radius: 12px;
          background: #fffbeb;
          padding: 10px 12px;
          color: #78350f;
        }

        .practice-coachingBanner strong {
          display: block;
          font-size: 12px;
        }

        .practice-coachingBanner span {
          display: block;
          margin-top: 2px;
          font-size: 11px;
          line-height: 1.45;
        }

        .practice-coachingBanner button {
          border: none;
          background: transparent;
          color: #92400e;
          padding: 0 2px;
          font-size: 19px;
          line-height: 1;
          cursor: pointer;
        }

        .practice-composer textarea {
          width: 100%;
          min-height: 78px;
          max-height: 150px;
          resize: vertical;
          box-sizing: border-box;
          border: 1px solid #dbe2ea;
          border-radius: 14px;
          background: #f8fafc;
          padding: 12px 13px;
          color: #111827;
          font: inherit;
          font-size: 13px;
          line-height: 1.5;
          outline: none;
        }

        .practice-composer textarea:focus {
          border-color: #94a3b8;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.14);
        }

        .practice-composer.is-coaching textarea {
          border-color: #f4d56b;
          background: #ffffff;
        }

        .practice-error {
          margin-top: 8px;
          color: #b91c1c;
          font-size: 12px;
        }

        .practice-composerActions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 10px;
        }

        .practice-composerActions span {
          color: #94a3b8;
          font-size: 11px;
        }

        .practice-teachCard {
  display: grid;
  gap: 14px;
  margin-top: 18px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.05);
}

.practice-teachCard h2 {
  margin: 0;
  color: #111827;
  font-size: 16px;
}

.practice-teachCard p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}

.practice-teachCard textarea {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  border: 1px solid #d1d5db;
  border-radius: 14px;
  background: #ffffff;
  padding: 12px 14px;
  color: #111827;
  font: inherit;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
}

.practice-teachCard textarea:focus {
  border-color: #94a3b8;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.14);
}

.practice-teachReply {
  white-space: pre-wrap;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #f8fbff;
  padding: 12px 14px;
  color: #334155;
  font-size: 13px;
  line-height: 1.6;
}

.practice-teachActions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

        @media (max-width: 900px) {
          .practice-page {
            max-width: none;
            margin: 0;
        }

          .practice-top {
            display: none;
          }

          .practice-card {
            min-height: calc(100vh - 72px);
            border-radius: 0;
            border-left: none;
            border-right: none;
          }

          .practice-card.is-empty {
            min-height: 0;
          }

          .practice-header {
            padding: 14px 16px;
          }

          .practice-description {
            display: none;
          }

          .practice-conversation {
            height: calc(100vh - 330px);
            min-height: 320px;
            padding: 16px 12px;
          }

          .practice-messageWrap {
            width: 88%;
          }

          .practice-composer {
            padding: 12px;
          }

          .practice-composerActions span {
            display: none;
          }

          .practice-composerActions {
            justify-content: flex-end;
          }

          .practice-teachCard {
            margin: 12px;
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  DEMO_BUCKET_TEXT,
  demoDetectBucket,
  type DemoBucketName,
} from '@/config/demoAssistant';

type Role = 'assistant' | 'user';

type DemoMessage = {
  id: string;
  role: Role;
  text: string;
};

function fallbackDefault(): string {
  return (
    'In this demo I’m focused on store-style questions like orders, ' +
    'shipping, returns, and sizing. In the full product, I’d use your own ' +
    'FAQs, docs, and store data to answer more precisely.'
  );
}

export default function DemoChat() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const bucketIndexRef = useRef<Partial<Record<DemoBucketName, number>>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputRowRef = useRef<HTMLFormElement | null>(null);

  // Auto-scroll when messages change (plus nudge the whole page for iOS)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  }, [messages.length]);

  const pickFromBucket = (bucket: DemoBucketName): string => {
    const variants = DEMO_BUCKET_TEXT[bucket];
    if (!variants || variants.length === 0) return '';

    const currentIndex = bucketIndexRef.current[bucket] ?? 0;
    const nextText = variants[currentIndex];
    bucketIndexRef.current[bucket] = (currentIndex + 1) % variants.length;
    return nextText;
  };

  const callDemoApi = async (
    userText: string,
    bucket: DemoBucketName,
    history: DemoMessage[],
  ): Promise<string> => {
    const historyForApi = history.map((m) => ({
      role: m.role,
      content: m.text,
    }));

    try {
      const res = await fetch('/api/demo-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userText, bucket, history: historyForApi }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: { reply?: string } = await res.json();
      if (data.reply && data.reply.trim()) {
        return data.reply.trim();
      }

      return pickFromBucket(bucket) || fallbackDefault();
    } catch (err) {
      console.error('Demo assistant API error', err);
      return pickFromBucket(bucket) || fallbackDefault();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const bucket = demoDetectBucket(trimmed);

    const userMessage: DemoMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');

    // Keep keyboard open + input row visible
    setTimeout(() => {
      inputRef.current?.focus();
      inputRowRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }, 50);

    setIsLoading(true);
    const replyText = await callDemoApi(trimmed, bucket, newHistory);
    setIsLoading(false);

    const assistantMessage: DemoMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      text: replyText,
    };

    setMessages((prev) => [...prev, assistantMessage]);
  };

  const isSendingDisabled = !input.trim() || isLoading;

  return (
    <section
      className="demo-chat-shell"
      aria-label="TikoZap conversation"
    >
      <div className="demo-chat-card">
        {/* Header */}
        <header className="demo-chat-header">
          <div className="demo-chat-header-main">
            <div className="demo-chat-avatar">TZ</div>
            <div className="demo-chat-header-text">
              <div className="demo-chat-title">TikoZap</div>
              <div className="demo-chat-subtitle">
                Test drive how TikoZap would support a sample store. This preview
                never touches real orders or customer data.
              </div>
            </div>
          </div>
          <span className="demo-chat-pill">Demo mode</span>
        </header>

        {/* Body */}
        <div className="demo-chat-body">
          <div className="demo-chat-messages">
            {/* Static intro bubble */}
            <div className="demo-chat-row">
              <div className="demo-chat-bubble demo-chat-bubble--assistant">
                <p>
                  Ask about orders, shipping, returns, or sizing — or ask how I’d work
                  in your own store. I’ll answer like I would in the real product, but
                  using safe sample data in this preview.
                </p>
                <p className="demo-chat-note">
                  In a real workspace I connect to your platform (for example Shopify),
                  read your policies, products, and past tickets, and handle routine
                  questions 24/7 while passing edge cases to your human team.
                </p>
                <p className="demo-chat-note">
                  You can chat in English, Spanish, or Chinese. This demo also has a
                  small limit you could add later on how many questions visitors can ask
                  before you suggest starting a free 14-day Pro trial.
                </p>
              </div>
            </div>

            {/* Conversation */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const paragraphs = msg.text
                .split('\n')
                .flatMap((block) => block.split('\n\n'));

              return (
                <div
                  key={msg.id}
                  className={`demo-chat-row ${
                    isUser ? 'demo-chat-row--user' : 'demo-chat-row--assistant'
                  }`}
                >
                  <div
                    className={`demo-chat-bubble ${
                      isUser
                        ? 'demo-chat-bubble--user'
                        : 'demo-chat-bubble--assistant'
                    }`}
                  >
                    {paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Input row */}
          <form
            ref={inputRowRef}
            className="demo-chat-input-row"
            onSubmit={handleSubmit}
          >
            <input
              ref={inputRef}
              className="demo-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about an order, shipping, returns, or sizing…"
              autoComplete="off"
              onFocus={() => {
                setTimeout(() => {
                  inputRowRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end',
                  });
                }, 150);
              }}
            />
            <button
              type="submit"
              className="demo-chat-send"
              disabled={isSendingDisabled}
              aria-label="Send message"
            >
              ↑
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .demo-chat-shell {
          width: 100%;
        }

        .demo-chat-card {
          border-radius: 1.25rem;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }

        .demo-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.8rem 1rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .demo-chat-header-main {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          min-width: 0;
        }

        .demo-chat-avatar {
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          background: #111827;
          color: #f9fafb;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .demo-chat-header-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .demo-chat-title {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .demo-chat-subtitle {
          font-size: 0.75rem;
          color: #6b7280;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .demo-chat-pill {
          font-size: 0.75rem;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #4b5563;
          flex-shrink: 0;
        }

        .demo-chat-body {
          display: flex;
          flex-direction: column;
          max-height: min(650px, 75vh);
        }

        .demo-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 0.9rem 1rem 0.6rem;
          background: #f9fafb;
        }

        .demo-chat-row {
          display: flex;
          margin-bottom: 0.6rem;
        }

        .demo-chat-row--assistant {
          justify-content: flex-start;
        }

        .demo-chat-row--user {
          justify-content: flex-end;
        }

        .demo-chat-bubble {
          max-width: 80%;
          border-radius: 1rem;
          padding: 0.6rem 0.8rem;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .demo-chat-bubble--assistant {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          color: #111827;
        }

        .demo-chat-bubble--user {
          background: #e5e7eb;
          color: #111827;
          border: 1px solid #d1d5db;
        }

        .demo-chat-note {
          margin-top: 0.35rem;
          font-size: 0.78rem;
          color: #6b7280;
        }

        .demo-chat-input-row {
          position: sticky;
          bottom: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 0.75rem;
          border-top: 1px solid #e5e7eb;
          background: #ffffff;
          scroll-margin-bottom: 320px;
        }

        .demo-chat-input {
          flex: 1;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          padding: 0.6rem 0.9rem;
          font-size: 0.9rem;
          outline: none;
        }

        .demo-chat-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.3);
        }

        .demo-chat-send {
          width: 2.4rem;
          height: 2.4rem;
          border-radius: 999px;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 600;
          background: #2563eb;
          color: #f9fafb;
          cursor: pointer;
          flex-shrink: 0;
        }

        .demo-chat-send:disabled {
          opacity: 0.45;
          cursor: default;
        }

        @media (min-width: 768px) {
          .demo-chat-card {
            border-radius: 1.5rem;
          }

          .demo-chat-body {
            max-height: 600px;
          }
        }
      `}</style>
    </section>
  );
}

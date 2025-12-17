'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

type Message = {
  from: 'customer' | 'bot';
  text: string;
};

const PRESET_QUESTIONS = [
  {
    id: 'shipping',
    label: 'Where is my order?',
    question: 'Where is my order?',
    answer:
      "Sure! I can help with that. What’s your order number? Once I have it, I’ll pull the latest tracking info and show you the status and delivery ETA.",
  },
  {
    id: 'returns',
    label: 'Return policy',
    question: 'What is your return policy?',
    answer:
      'You can return most items within 30 days of delivery as long as they’re unused and in original packaging. Once we receive the return, refunds are processed within 3–5 business days.',
  },
  {
    id: 'shipping-times',
    label: 'Do you ship internationally?',
    question: 'Do you ship internationally?',
    answer:
      'Yes! We ship to over 40 countries. Shipping is free on orders over $50 in the US and discounted rates apply for international orders at checkout.',
  },
  {
    id: 'product',
    label: 'Ask about sizing',
    question: 'Can you help me choose the right size?',
    answer:
      'Absolutely. Tell me which product you’re looking at and how you prefer the fit (true to size, looser, or more fitted), and I’ll recommend a size based on our sizing guide and customer feedback.',
  },
];

const TYPING_SPEED_MS = 22; // smaller = faster typing

export default function DemoPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      from: 'bot',
      text: "Hi 👋 I’m the TikoZap. Tap a question below to see how I’d reply for your store.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const chatRef = useRef<HTMLDivElement | null>(null);
  const typingIntervalRef = useRef<number | null>(null);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current !== null) {
        window.clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const playBotAnswer = (answer: string) => {
    // Stop any previous typing animation
    if (typingIntervalRef.current !== null) {
      window.clearInterval(typingIntervalRef.current);
    }

    // Add an empty bot message that we'll fill in character by character
    setMessages((prev) => [...prev, { from: 'bot', text: '' }]);
    setIsTyping(true);

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;

      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const lastIndex = next.length - 1;
        const last = next[lastIndex];

        // Only animate the last message if it's a bot message
        if (!last || last.from !== 'bot') return prev;

        next[lastIndex] = {
          ...last,
          text: answer.slice(0, i),
        };
        return next;
      });

      if (i >= answer.length) {
        window.clearInterval(id);
        typingIntervalRef.current = null;
        setIsTyping(false);
      }
    }, TYPING_SPEED_MS);

    typingIntervalRef.current = id;
  };

  const handlePresetClick = (id: string) => {
    const preset = PRESET_QUESTIONS.find((p) => p.id === id);
    if (!preset) return;

    // Add customer question immediately
    setMessages((prev) => [
      ...prev,
      { from: 'customer', text: preset.question },
    ]);

    // Then animate the bot answer
    playBotAnswer(preset.answer);
  };

  return (
    <main id="main" className="demo-main">
      {/* Demo hero */}
      <section className="demo-hero">
        <div className="container demo-hero-inner">
          <p className="eyebrow">Live demo</p>
          <h1>See TikoZap in action</h1>
          <p className="sub">
            This is a simple mock store inbox. Try a few common questions and see how
            TikoZap could answer your customers 24/7.
          </p>
        </div>
      </section>

      {/* Layout: chat on left, explainer on right */}
      <section className="demo-layout">
        <div className="container demo-layout-inner">
          {/* Chat column */}
          <section className="demo-chat-card">
            <header className="demo-chat-header">
              <div className="demo-store-pill">
                <span className="demo-store-logo">TS</span>
                <div className="demo-store-text">
                  <span className="demo-store-name">TikoZap Demo Store</span>
                  <span className="demo-store-status">AI assistant · Online now</span>
                </div>
              </div>
            </header>

            <div className="demo-chat-window" ref={chatRef}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`demo-message demo-message--${msg.from}`}
                >
                  <div className="demo-bubble">{msg.text}</div>
                </div>
              ))}

              {isTyping && (
                <div className="demo-message demo-message--bot">
                  <div className="demo-bubble demo-bubble-typing">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
            </div>

            <div className="demo-preset-row">
              {PRESET_QUESTIONS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="demo-preset-btn"
                  onClick={() => handlePresetClick(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <p className="demo-hint small">
              These are example replies. In your real account, answers are grounded in
              your store data, policies, and guardrails.
            </p>
          </section>

          {/* Explainer column */}
          <aside className="demo-side-card">
            <h2>What this demo is showing</h2>
            <ul className="demo-list">
              <li>
                <strong>24/7 instant replies.</strong> Customers get answers in seconds
                instead of waiting in your inbox.
              </li>
              <li>
                <strong>Store-aware answers.</strong> Shipping, returns, and product
                details come from your own policies and catalog.
              </li>
              <li>
                <strong>Guardrails by design.</strong> Actions like refunds or discounts
                only follow rules you approve.
              </li>
              <li>
                <strong>Easy handoff to humans.</strong> When something feels
                high-stakes, TikoZap hands the conversation to your team with full
                context.
              </li>
            </ul>

            <div className="demo-side-cta">
              <p className="small">Ready to see this for your own store?</p>
              <div className="demo-side-buttons">
  <Link href="/signup" className="button">
    Get started free
  </Link>
  <Link href="/pricing" className="button-outline">
    View pricing
  </Link>
</div>

            </div>
          </aside>
        </div>
      </section>

      <style jsx>{`
        .demo-main {
          padding-top: 4.5rem; /* match fixed nav */
          padding-bottom: 3rem;
        }

        .demo-hero {
          padding: 1.75rem 0 1.5rem;
        }

        .demo-hero-inner {
          max-width: 40rem;
        }

        .demo-hero h1 {
          margin-bottom: 0.5rem;
        }

        .demo-layout {
          padding: 0.5rem 0 0;
        }

        .demo-layout-inner {
          display: grid;
          gap: 1.5rem;
        }

        .demo-chat-card,
        .demo-side-card {
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 1rem;
        }

        .demo-chat-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .demo-chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .demo-store-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          background: #f3f4f6;
        }

        .demo-store-logo {
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 600;
          background: #111827;
          color: #f9fafb;
        }

        .demo-store-text {
          display: flex;
          flex-direction: column;
        }

        .demo-store-name {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .demo-store-status {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .demo-chat-window {
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          padding: 0.75rem;
          height: 260px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .demo-message {
          display: flex;
        }

        .demo-message--customer {
          justify-content: flex-end;
        }

        .demo-message--bot {
          justify-content: flex-start;
        }

        .demo-bubble {
          max-width: 80%;
          padding: 0.55rem 0.7rem;
          border-radius: 0.85rem;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .demo-message--customer .demo-bubble {
          background: #2563eb;
          color: #f9fafb;
          border-bottom-right-radius: 0.2rem;
        }

        .demo-message--bot .demo-bubble {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-bottom-left-radius: 0.2rem;
        }

        .demo-bubble-typing {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
        }

        .typing-dot {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: #9ca3af;
          animation: typingBlink 1s infinite ease-in-out;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes typingBlink {
          0%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-1px);
          }
        }

        .demo-preset-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.4rem;
        }

        .demo-preset-btn {
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          padding: 0.35rem 0.7rem;
          font-size: 0.8rem;
          background: #f9fafb;
          color: #111827;
          white-space: nowrap;
          cursor: pointer;
        }

        .demo-preset-btn:hover {
          background: #e5e7eb;
        }

        .demo-hint {
          margin-top: 0.25rem;
          color: #6b7280;
        }

        .demo-side-card h2 {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .demo-list {
          list-style: disc;
          padding-left: 1.2rem;
          margin: 0 0 1.25rem;
          font-size: 0.9rem;
          color: #374151;
        }

        .demo-list li + li {
          margin-top: 0.4rem;
        }

        .demo-side-cta {
          border-top: 1px solid #e5e7eb;
          padding-top: 0.75rem;
          margin-top: 0.25rem;
        }

        .demo-side-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        @media (min-width: 768px) {
          .demo-layout-inner {
            grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
          }

          .demo-chat-card,
          .demo-side-card {
            padding: 1.15rem 1.25rem;
          }

          .demo-chat-window {
            height: 300px;
          }
        }

        @media (max-width: 640px) {
          .demo-hero-inner {
            text-align: left;
          }

          .demo-layout-inner {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </main>
  );
}

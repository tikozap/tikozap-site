// src/components/DemoChat.tsx

"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  DEMO_BUCKET_TEXT,
  demoDetectBucket,
  type DemoBucketName,
} from "@/config/demoAssistant";

type Role = "assistant" | "user";
type ReplySource = "rule" | "model" | "canned";

type DemoProduct = {
  id: string;
  title: string;
  price?: number;
  image?: string;
  available?: boolean;
  url?: string;
};

type DemoMessage = {
  id: string;
  role: Role;
  text: string;
  source?: ReplySource;
  safePreview?: boolean;
  products?: DemoProduct[];
};

const STARTER_PROMPTS = [
  "Show me dresses",
  "Find me a black jacket",
  "How does this help my Shopify store?",
  "How do I start?",
];

function fallbackDefault(): string {
  return "I’m here to help with products, Shopify, and growing your store.";
}

function sourceLabel(source?: ReplySource) {
  if (source === "model") return "Live model";
  if (source === "rule") return "Grounded reply";
  return "Safe preview";
}

export default function DemoChat() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamingReply, setIsStreamingReply] = useState(false);
  const [showLeadCta, setShowLeadCta] = useState(false);

  const bucketIndexRef = useRef<Partial<Record<DemoBucketName, number>>>({});
  const lastTopicRef = useRef<DemoBucketName | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputRowRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages.length]);

  const pickFromBucket = (bucket: DemoBucketName): string => {
    const variants = DEMO_BUCKET_TEXT[bucket];
    if (!variants || variants.length === 0) return "";

    const currentIndex = bucketIndexRef.current[bucket] ?? 0;
    const nextText = variants[currentIndex];
    bucketIndexRef.current[bucket] = (currentIndex + 1) % variants.length;
    return nextText;
  };

  const resolveBucket = (text: string): DemoBucketName => {
    const detected = demoDetectBucket(text);
    if (detected !== "off_topic") {
      lastTopicRef.current = detected;
      return detected;
    }

    const lower = text.toLowerCase().trim();
    const followup =
      lower.startsWith("and ") ||
      lower.startsWith("also ") ||
      lower.startsWith("what about") ||
      lower.startsWith("how about") ||
      lower.startsWith("then ") ||
      lower.includes("tell me more") ||
      lower.split(/\s+/).length <= 6;

    if (followup && lastTopicRef.current && lastTopicRef.current !== "off_topic") {
      return lastTopicRef.current;
    }

    return detected;
  };

  const updateAssistantMessage = (
    messageId: string,
    patch: Partial<DemoMessage>
  ) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...patch } : m))
    );
  };

  const streamAssistantText = async (
    messageId: string,
    fullText: string,
    source: ReplySource,
    safePreview: boolean
  ) => {
    const chunks = fullText.split(/(\s+)/).filter(Boolean);
    let built = "";

    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        role: "assistant",
        text: "",
        source,
        safePreview,
        products: [],
      },
    ]);

    setIsStreamingReply(true);

    for (let i = 0; i < chunks.length; i++) {
      built += chunks[i];
      updateAssistantMessage(messageId, { text: built });

      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, i < 10 ? 18 : 12));
      }
    }

    setIsStreamingReply(false);
  };

  const callDemoApi = async (
    userText: string,
    bucket: DemoBucketName,
    history: DemoMessage[]
  ): Promise<{
    reply: string;
    source: ReplySource;
    safePreview: boolean;
    products: DemoProduct[];
  }> => {
    const historyForApi = history.slice(-12).map((m) => ({
      role: m.role,
      content: m.text,
    }));

    try {
      const res = await fetch("/api/demo-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText, bucket, history: historyForApi }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: {
        reply?: string;
        source?: ReplySource;
        safePreview?: boolean;
        products?: DemoProduct[];
      } = await res.json();

      const source = data.source ?? "canned";

      return {
        reply: data.reply?.trim() || pickFromBucket(bucket) || fallbackDefault(),
        source,
        safePreview: data.safePreview !== false,
        products: Array.isArray(data.products) ? data.products : [],
      };
    } catch (err) {
      console.error("Demo assistant API error", err);

      return {
        reply: pickFromBucket(bucket) || fallbackDefault(),
        source: "canned",
        safePreview: true,
        products: [],
      };
    }
  };

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isLoading || isStreamingReply) return;

    const bucket = resolveBucket(trimmed);

    const userMessage: DemoMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput("");

    const userTurnCount = newHistory.filter((m) => m.role === "user").length;
    if (userTurnCount >= 2) {
      setShowLeadCta(true);
    }

    setTimeout(() => {
      inputRef.current?.focus();
      inputRowRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);

    const assistantId = `a-${Date.now()}`;

    setIsLoading(true);
    try {
      const apiResult = await callDemoApi(trimmed, bucket, newHistory);
      setIsLoading(false);

      await streamAssistantText(
        assistantId,
        apiResult.reply,
        apiResult.source,
        apiResult.safePreview
      );

      if (apiResult.products.length) {
        updateAssistantMessage(assistantId, { products: apiResult.products });
        setShowLeadCta(true);
      }

      if (
        userTurnCount === 2 &&
        !trimmed.toLowerCase().includes("revenue") &&
        !trimmed.toLowerCase().includes("roi")
      ) {
        fetch("/api/demo/revenue-estimate")
          .then((r) => r.json())
          .then((data) => {
            if (!data?.ok || !data?.estimate) return;

            const est = data.estimate;
            const summary = data.summary;

            const revenueText =
              `I reviewed your recent store context.\n\n` +
              `• Store: ${summary?.storeName || "Shopify Store"}\n` +
              `• Current monthly revenue: ~$${Math.round(est.baselineRevenue)}\n` +
              `• Estimated lift with Tiko: +$${Math.round(est.conservativeGain)} to +$${Math.round(est.strongGain)}\n` +
              `• Expected midpoint: ~$${Math.round(est.expectedGain)}\n\n` +
              `That’s the upside when shoppers get answers instantly instead of leaving.\n\n` +
              `Want me to show how this would work on your store?`;

            setMessages((prev) => [
              ...prev,
              {
                id: `a-roi-${Date.now()}`,
                role: "assistant",
                text: revenueText,
                source: "rule",
                safePreview: true,
                products: [],
              },
            ]);

            setShowLeadCta(true);
          })
          .catch((err) => {
            console.error("Revenue estimate fetch failed", err);
          });
      }
    } catch (err) {
      console.error("sendMessage error", err);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const startFresh = () => {
    setMessages([]);
    setInput("");
    setShowLeadCta(false);
    setIsStreamingReply(false);
    bucketIndexRef.current = {};
    lastTopicRef.current = null;
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const isBusy = isLoading || isStreamingReply;
  const isSendingDisabled = !input.trim() || isBusy;
  const userTurns = messages.filter((m) => m.role === "user").length;

  return (
    <section className="demo-chat-shell" aria-label="TikoZap conversation">
      <div className="demo-chat-card">
        <header className="demo-chat-header">
          <div className="demo-chat-header-main">
            <div className="demo-chat-avatar">TZ</div>
            <div className="demo-chat-header-text">
              <div className="demo-chat-title">Tiko</div>
              <div className="demo-chat-subtitle">Preview mode</div>
            </div>
          </div>

          <div className="demo-chat-header-actions">
            <button
              type="button"
              className="demo-chat-reset"
              onClick={startFresh}
            >
              New chat
            </button>
          </div>
        </header>

        <div className="demo-chat-body">
          {userTurns < 2 && (
            <div className="demo-chat-prompts" aria-label="Suggested prompts">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="demo-chat-prompt"
                  onClick={() => sendMessage(p)}
                  disabled={isBusy}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <div className="demo-chat-messages">
            <div className="demo-chat-row">
              <div className="demo-chat-bubble demo-chat-bubble--assistant">
                <p>
                  Hi, I’m Tiko. Ask me about products, orders, Shopify, or how I
                  help merchants convert more shoppers.
                </p>
                <p className="demo-chat-note">
                  In this preview, I’ll sound like the real assistant while staying
                  honest about demo limits.
                </p>
              </div>
            </div>

            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const paragraphs = msg.text
                .split("\n")
                .flatMap((block) => block.split("\n\n"));

              return (
                <div
                  key={msg.id}
                  className={`demo-chat-row ${
                    isUser
                      ? "demo-chat-row--user"
                      : "demo-chat-row--assistant"
                  }`}
                >
                  <div
                    className={`demo-chat-bubble ${
                      isUser
                        ? "demo-chat-bubble--user"
                        : "demo-chat-bubble--assistant"
                    }`}
                  >
                    {paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}

                    {!isUser && msg.products?.length ? (
                      <div className="demo-product-list">
                        {msg.products.map((p, idx) => {
                          const tag =
                            idx === 0
                              ? "Best Match"
                              : idx === 1
                              ? "Best Value"
                              : "Popular Pick";

                          return (
                            <a
                              key={p.id}
                              href={p.url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="demo-product-card"
                            >
                              <div className="demo-product-main">
                                {p.image ? (
                                  <img
                                    src={p.image}
                                    alt={p.title}
                                    className="demo-product-image"
                                  />
                                ) : (
                                  <div className="demo-product-image demo-product-image--empty" />
                                )}

                                <div className="demo-product-copy">
                                  <div className="demo-product-title">
                                    {p.title}
                                  </div>

                                  {typeof p.price === "number" ? (
                                    <div className="demo-product-price">
                                      ${p.price.toFixed(2)}
                                    </div>
                                  ) : null}

                                  <div className="demo-product-stock">
                                    {p.available ? "In stock" : "Unavailable"}
                                  </div>

                                  <div className="demo-product-tag">{tag}</div>
                                </div>
                              </div>

                              <div className="demo-product-footer">
                                <span>Ready to present in chat</span>
                                <span>View product →</span>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    ) : null}

                    {!isUser ? (
                      <div className="demo-chat-meta">
                        <span className="demo-chat-source">
                          {sourceLabel(msg.source)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="demo-chat-row demo-chat-row--assistant">
                <div className="demo-chat-bubble demo-chat-bubble--assistant demo-chat-bubble--typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            {showLeadCta && (
              <div className="demo-lead-cta" aria-label="Demo conversion CTA">
                <p className="demo-lead-cta-kicker">
                  See how this turns into real revenue:
                </p>

                <p className="demo-lead-cta-title">
                  <strong>Want Tiko running on your store?</strong>
                </p>

                <p className="demo-lead-cta-copy">
                  Connect your store, sync your catalog, and start converting
                  shoppers in chat.
                </p>

                <div className="demo-lead-cta-actions">
                  <a href="/signup?plan=pro" className="demo-lead-cta-primary">
                    Start Free 14-day Trial
                  </a>

                  <a href="/pricing" className="demo-lead-cta-secondary">
                    View Pricing
                  </a>

                  <a href="/demo-book" className="demo-lead-cta-secondary">
                    Book Live Demo
                  </a>
                </div>

                <p className="demo-lead-cta-note">
                  No credit card required. Tiko only earns when it helps generate
                  sales.
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

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
              placeholder="Ask about products, orders, or store info..."
              autoComplete="off"
            />
            <button
              type="submit"
              className="demo-chat-send"
              disabled={isSendingDisabled}
              aria-label="Send message"
            >
              Send
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
          font-size: 0.95rem;
          font-weight: 700;
        }

        .demo-chat-subtitle {
          font-size: 0.72rem;
          color: #6b7280;
        }

        .demo-chat-header-actions {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .demo-chat-reset {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #374151;
          font-size: 0.75rem;
          padding: 0.35rem 0.65rem;
          cursor: pointer;
        }

        .demo-chat-body {
          display: flex;
          flex-direction: column;
          max-height: min(720px, 78vh);
          min-height: 0;
        }

        .demo-chat-prompts {
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
          padding: 0.65rem 0.8rem 0.2rem;
          border-bottom: 1px solid #eef2f7;
          background: #ffffff;
        }

        .demo-chat-prompt {
          border: 1px solid #d1d5db;
          border-radius: 999px;
          background: #ffffff;
          color: #111827;
          font-size: 0.75rem;
          padding: 0.32rem 0.58rem;
          cursor: pointer;
          text-align: left;
        }

        .demo-chat-prompt:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .demo-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 0.9rem 1rem 6rem;
          background: #f9fafb;
        }

        .demo-chat-row {
          display: flex;
          margin-bottom: 0.65rem;
        }

        .demo-chat-row--user {
          justify-content: flex-end;
        }

        .demo-chat-row--assistant {
          justify-content: flex-start;
        }

        .demo-chat-bubble {
          max-width: min(88%, 680px);
          border-radius: 1rem;
          padding: 0.78rem 0.9rem;
          font-size: 0.95rem;
          line-height: 1.55;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
        }

        .demo-chat-bubble--assistant {
          background: #ffffff;
          color: #111827;
        }

        .demo-chat-bubble--user {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        .demo-chat-bubble p {
          margin: 0 0 0.6rem;
        }

        .demo-chat-bubble p:last-child {
          margin-bottom: 0;
        }

        .demo-chat-note {
          color: #6b7280;
          font-size: 0.82rem;
        }

        .demo-chat-meta {
          margin-top: 0.55rem;
          display: flex;
          justify-content: flex-start;
        }

        .demo-chat-source {
          font-size: 0.72rem;
          color: #6b7280;
        }

        .demo-product-list {
          margin-top: 0.85rem;
          display: grid;
          gap: 0.85rem;
        }

        .demo-product-card {
          display: block;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          text-decoration: none;
          color: #111827;
          overflow: hidden;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
        }

        .demo-product-main {
          display: flex;
          gap: 0.8rem;
          padding: 0.8rem;
        }

        .demo-product-image {
          width: 84px;
          height: 84px;
          border-radius: 0.8rem;
          object-fit: cover;
          background: #f3f4f6;
          flex-shrink: 0;
        }

        .demo-product-image--empty {
          background: #f3f4f6;
        }

        .demo-product-copy {
          min-width: 0;
          flex: 1;
        }

        .demo-product-title {
          font-size: 0.92rem;
          font-weight: 700;
          line-height: 1.35;
        }

        .demo-product-price {
          margin-top: 0.25rem;
          font-size: 0.94rem;
          font-weight: 600;
        }

        .demo-product-stock {
          margin-top: 0.2rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .demo-product-tag {
          margin-top: 0.45rem;
          display: inline-flex;
          border-radius: 999px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 0.15rem 0.45rem;
          font-size: 0.68rem;
          font-weight: 600;
        }

        .demo-product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          border-top: 1px solid #f1f5f9;
          padding: 0.6rem 0.8rem 0.75rem;
          font-size: 0.74rem;
          color: #6b7280;
        }

        .demo-product-footer span:last-child {
          color: #2563eb;
          font-weight: 600;
        }

        .demo-chat-bubble--typing {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .typing-dot {
          width: 0.42rem;
          height: 0.42rem;
          border-radius: 999px;
          background: #94a3b8;
          animation: pulse 1.1s infinite ease-in-out;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        .demo-lead-cta {
          margin-top: 1rem;
          border: 1px solid #dbeafe;
          background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
          border-radius: 1rem;
          padding: 1rem;
        }

        .demo-lead-cta-kicker {
          margin: 0 0 0.25rem;
          font-size: 0.72rem;
          color: #2563eb;
          font-weight: 600;
        }

        .demo-lead-cta-title {
          margin: 0;
          font-size: 0.95rem;
          color: #111827;
        }

        .demo-lead-cta-copy {
          margin: 0.4rem 0 0;
          font-size: 0.8rem;
          line-height: 1.45;
          color: #4b5563;
        }

        .demo-lead-cta-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          margin-top: 0.8rem;
        }

        .demo-lead-cta-primary,
        .demo-lead-cta-secondary {
          text-decoration: none;
          border-radius: 999px;
          padding: 0.6rem 0.9rem;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .demo-lead-cta-primary {
          background: #2563eb;
          color: white;
        }

        .demo-lead-cta-secondary {
          background: white;
          color: #1f2937;
          border: 1px solid #d1d5db;
        }

        .demo-lead-cta-note {
          margin: 0.7rem 0 0;
          font-size: 0.72rem;
          color: #6b7280;
        }

        .demo-chat-input-row {
          display: flex;
          gap: 0.6rem;
          padding: 0.85rem 1rem;
          border-top: 1px solid #e5e7eb;
          background: #ffffff;
          position: sticky;
          bottom: 0;
        }

        .demo-chat-input {
          flex: 1;
          min-width: 0;
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          padding: 0.78rem 1rem;
          font-size: 0.95rem;
          outline: none;
        }

        .demo-chat-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .demo-chat-send {
          border: none;
          background: #2563eb;
          color: white;
          border-radius: 999px;
          padding: 0 1rem;
          min-width: 72px;
          font-weight: 700;
          cursor: pointer;
        }

        .demo-chat-send:disabled {
          opacity: 0.55;
          cursor: default;
        }

        @keyframes pulse {
          0%,
          80%,
          100% {
            opacity: 0.35;
            transform: scale(0.92);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 640px) {
          .demo-chat-header {
            padding: 0.7rem 0.8rem;
          }

          .demo-chat-messages {
            padding: 0.8rem 0.75rem 7rem;
          }

          .demo-chat-input-row {
            padding: 0.75rem;
          }

          .demo-chat-bubble {
            max-width: 92%;
          }

          .demo-product-main {
            padding: 0.72rem;
          }

          .demo-product-image {
            width: 70px;
            height: 70px;
          }
        }
      `}</style>
    </section>
  );
}
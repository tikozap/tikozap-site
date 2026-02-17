'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  DEMO_BUCKET_TEXT,
  demoDetectBucket,
  type DemoBucketName,
} from '@/config/demoAssistant';

type Role = 'assistant' | 'user';
type ReplySource = 'rule' | 'model' | 'canned';
type ScoreDelta = {
  accuracy: number;
  safety: number;
  handoff: number;
  setupFit: number;
};

type DemoReplyMeta = {
  scoreDelta: ScoreDelta;
  signals: {
    mentionsStarterLink: boolean;
    mentionsHandoff: boolean;
    mentionsSafePreview: boolean;
    mentionsSetupPath: boolean;
  };
  rationale: {
    accuracy: string;
    safety: string;
    handoff: string;
    setupFit: string;
  };
};

type DemoMessage = {
  id: string;
  role: Role;
  text: string;
  source?: ReplySource;
  safePreview?: boolean;
  meta?: DemoReplyMeta;
};

function fallbackDefault(): string {
  return (
    'In this demo I am focused on store-style questions like orders, ' +
    'shipping, returns, and sizing. In the full product, I would use your own ' +
    'FAQs, docs, and store data to answer more precisely.'
  );
}

const STARTER_PROMPTS = [
  'I do not have a website. How would Starter Link work?',
  'Show me how you handle an order status question.',
  'How does human takeover work in the inbox?',
  'What can I set up in the first 15 minutes?',
];

type DemoScorecard = {
  accuracy: number;
  safety: number;
  handoff: number;
  setupFit: number;
};

type TransportSnapshot = {
  firstTokenMs?: number;
  totalResponseMs?: number;
  usedSse: boolean;
  fallbackUsed: boolean;
};

type TwoLayerQualityReport = {
  scores: {
    transport: number;
    conversation: number;
    overall: number;
  };
  grade: 'A' | 'B' | 'C' | 'D';
  reasons: string[];
  recommendations: string[];
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function applyDelta(prev: DemoScorecard, delta?: ScoreDelta): DemoScorecard {
  if (!delta) return prev;
  return {
    accuracy: clampScore(prev.accuracy + delta.accuracy),
    safety: clampScore(prev.safety + delta.safety),
    handoff: clampScore(prev.handoff + delta.handoff),
    setupFit: clampScore(prev.setupFit + delta.setupFit),
  };
}

function fallbackMeta(source: ReplySource): DemoReplyMeta {
  const base =
    source === 'model'
      ? { accuracy: 8, safety: 6, handoff: 4, setupFit: 5 }
      : source === 'rule'
      ? { accuracy: 7, safety: 7, handoff: 5, setupFit: 6 }
      : { accuracy: 5, safety: 5, handoff: 3, setupFit: 4 };
  return {
    scoreDelta: base,
    signals: {
      mentionsStarterLink: false,
      mentionsHandoff: false,
      mentionsSafePreview: true,
      mentionsSetupPath: false,
    },
    rationale: {
      accuracy:
        source === 'model'
          ? 'Model response path used for richer answer coverage.'
          : source === 'rule'
          ? 'Rule-guided reply keeps product positioning consistent.'
          : 'Canned fallback path used to keep responses safe.',
      safety: 'Safety baseline applied by demo guardrails.',
      handoff: 'Ask about escalation to see explicit handoff guidance.',
      setupFit: 'Ask about setup or Starter Link to increase setup-fit score.',
    },
  };
}

export default function DemoChat() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamingReply, setIsStreamingReply] = useState(false);
  const [showLeadCta, setShowLeadCta] = useState(false);
  const [scorecard, setScorecard] = useState<DemoScorecard>({
    accuracy: 58,
    safety: 64,
    handoff: 52,
    setupFit: 54,
  });
  const [lastAssistantMeta, setLastAssistantMeta] = useState<DemoReplyMeta | null>(null);
  const [qualityReport, setQualityReport] = useState<TwoLayerQualityReport | null>(null);
  const [qualityError, setQualityError] = useState('');

  const bucketIndexRef = useRef<Partial<Record<DemoBucketName, number>>>({});
  const lastTopicRef = useRef<DemoBucketName | null>(null);
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

  const resolveBucket = (text: string): DemoBucketName => {
    const detected = demoDetectBucket(text);
    if (detected !== 'off_topic') {
      lastTopicRef.current = detected;
      return detected;
    }

    const lower = text.toLowerCase().trim();
    const followup =
      lower.startsWith('and ') ||
      lower.startsWith('also ') ||
      lower.startsWith('what about') ||
      lower.startsWith('how about') ||
      lower.startsWith('then ') ||
      lower.includes('can you explain more') ||
      lower.includes('tell me more') ||
      lower.split(/\s+/).length <= 6;

    if (followup && lastTopicRef.current && lastTopicRef.current !== 'off_topic') {
      return lastTopicRef.current;
    }

    return detected;
  };

  const updateAssistantMessage = (messageId: string, patch: Partial<DemoMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
    );
  };

  const streamAssistantText = async (
    messageId: string,
    fullText: string,
    source: ReplySource,
    safePreview: boolean,
    meta: DemoReplyMeta,
  ): Promise<TransportSnapshot> => {
    const start = performance.now();
    const chunks = fullText.split(/(\s+)/).filter(Boolean);
    let built = '';
    let firstTokenMs: number | undefined;

    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        role: 'assistant',
        text: '',
        source,
        safePreview,
        meta,
      },
    ]);

    setIsStreamingReply(true);
    for (let i = 0; i < chunks.length; i++) {
      built += chunks[i];
      if (firstTokenMs === undefined) {
        firstTokenMs = Math.round(performance.now() - start);
      }
      const nextText = built;
      updateAssistantMessage(messageId, { text: nextText });
      if (i < chunks.length - 1) {
        // Simulated token streaming fallback for browsers without SSE support.
        await new Promise((resolve) => setTimeout(resolve, i < 10 ? 20 : 12));
      }
    }
    setIsStreamingReply(false);

    return {
      firstTokenMs,
      totalResponseMs: Math.round(performance.now() - start),
      usedSse: false,
      fallbackUsed: true,
    };
  };

  const callDemoApi = async (
    userText: string,
    bucket: DemoBucketName,
    history: DemoMessage[],
  ): Promise<{
    reply: string;
    source: ReplySource;
    safePreview: boolean;
    meta: DemoReplyMeta;
  }> => {
    const historyForApi = history.slice(-12).map((m) => ({
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

      const data: {
        reply?: string;
        source?: ReplySource;
        safePreview?: boolean;
        meta?: DemoReplyMeta;
      } = await res.json();
      if (data.reply && data.reply.trim()) {
        const source = data.source ?? 'canned';
        return {
          reply: data.reply.trim(),
          source,
          safePreview: data.safePreview !== false,
          meta: data.meta ?? fallbackMeta(source),
        };
      }

      const source: ReplySource = 'canned';
      return {
        reply: pickFromBucket(bucket) || fallbackDefault(),
        source,
        safePreview: true,
        meta: fallbackMeta(source),
      };
    } catch (err) {
      console.error('Demo assistant API error', err);
      const source: ReplySource = 'canned';
      return {
        reply: pickFromBucket(bucket) || fallbackDefault(),
        source,
        safePreview: true,
        meta: fallbackMeta(source),
      };
    }
  };

  const callDemoSseApi = async (
    userText: string,
    bucket: DemoBucketName,
    history: DemoMessage[],
    assistantId: string,
  ): Promise<{
    reply: string;
    source: ReplySource;
    safePreview: boolean;
    meta: DemoReplyMeta;
    transport: TransportSnapshot;
  }> => {
    const historyForApi = history.slice(-12).map((m) => ({
      role: m.role,
      content: m.text,
    }));

    const start = performance.now();
    const res = await fetch('/api/demo-assistant/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userText, bucket, history: historyForApi }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`SSE unavailable (HTTP ${res.status})`);
    }

    let source: ReplySource = 'canned';
    let safePreview = true;
    let meta = fallbackMeta(source);
    let replyText = '';
    let firstTokenMs: number | undefined;

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        text: '',
        source,
        safePreview,
        meta,
      },
    ]);

    const applyMeta = (data: any) => {
      const nextSource =
        data?.source === 'model' || data?.source === 'rule' || data?.source === 'canned'
          ? (data.source as ReplySource)
          : source;
      source = nextSource;
      safePreview = data?.safePreview !== false;
      meta = data?.meta ?? fallbackMeta(nextSource);
      updateAssistantMessage(assistantId, {
        source,
        safePreview,
        meta,
      });
    };

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    setIsStreamingReply(true);
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

        let sep = buffer.indexOf('\n\n');
        while (sep !== -1) {
          const rawEvent = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          sep = buffer.indexOf('\n\n');
          if (!rawEvent.trim()) continue;

          const lines = rawEvent.split('\n');
          let eventName = 'message';
          const dataParts: string[] = [];

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
              continue;
            }
            if (line.startsWith('data:')) {
              dataParts.push(line.slice(5).trim());
            }
          }

          if (!dataParts.length) continue;
          let payload: any = null;
          try {
            payload = JSON.parse(dataParts.join('\n'));
          } catch {
            continue;
          }

          if (eventName === 'meta') {
            applyMeta(payload);
            continue;
          }

          if (eventName === 'delta') {
            const chunk = typeof payload?.chunk === 'string' ? payload.chunk : '';
            if (!chunk) continue;
            if (firstTokenMs === undefined) {
              firstTokenMs = Math.round(performance.now() - start);
              setIsLoading(false);
            }
            replyText += chunk;
            updateAssistantMessage(assistantId, { text: replyText });
            continue;
          }

          if (eventName === 'done') {
            applyMeta(payload);
            if (typeof payload?.reply === 'string') {
              replyText = payload.reply;
              updateAssistantMessage(assistantId, { text: replyText });
            }
            continue;
          }

          if (eventName === 'error') {
            throw new Error(
              typeof payload?.error === 'string'
                ? payload.error
                : 'Stream failed',
            );
          }
        }
      }
    } finally {
      setIsStreamingReply(false);
      setIsLoading(false);
    }

    if (!replyText.trim()) {
      throw new Error('Empty stream response');
    }

    return {
      reply: replyText.trim(),
      source,
      safePreview,
      meta,
      transport: {
        firstTokenMs: firstTokenMs ?? Math.round(performance.now() - start),
        totalResponseMs: Math.round(performance.now() - start),
        usedSse: true,
        fallbackUsed: false,
      },
    };
  };

  const runTwoLayerQuality = async (args: {
    source: ReplySource;
    signals: DemoReplyMeta['signals'];
    transport: TransportSnapshot;
    userTurns: number;
  }) => {
    try {
      setQualityError('');
      const res = await fetch('/api/quality/two-layer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transport: args.transport,
          conversation: {
            source: args.source,
            signals: args.signals,
            userTurns: args.userTurns,
          },
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data?.report) {
        throw new Error('Quality API error');
      }
      setQualityReport(data.report as TwoLayerQualityReport);
    } catch (err) {
      console.error('Two-layer quality evaluation error', err);
      setQualityError('Quality score unavailable for this turn.');
    }
  };

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isLoading || isStreamingReply) return;

    const bucket = resolveBucket(trimmed);

    const userMessage: DemoMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    const userTurnCount = newHistory.filter((m) => m.role === 'user').length;
    if (userTurnCount >= 3) setShowLeadCta(true);

    // Keep keyboard open + input row visible
    setTimeout(() => {
      inputRef.current?.focus();
      inputRowRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }, 50);

    const assistantId = `a-${Date.now()}`;
    let apiResult: {
      reply: string;
      source: ReplySource;
      safePreview: boolean;
      meta: DemoReplyMeta;
    };
    let transport: TransportSnapshot;

    setIsLoading(true);
    try {
      const sseResult = await callDemoSseApi(trimmed, bucket, newHistory, assistantId);
      apiResult = sseResult;
      transport = sseResult.transport;
    } catch (sseErr) {
      console.warn('SSE stream unavailable, using simulated fallback', sseErr);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));

      const apiFallback = await callDemoApi(trimmed, bucket, newHistory);
      setIsLoading(false);
      transport = await streamAssistantText(
        assistantId,
        apiFallback.reply,
        apiFallback.source,
        apiFallback.safePreview,
        apiFallback.meta,
      );
      apiResult = apiFallback;
    } finally {
      setIsLoading(false);
    }

    setLastAssistantMeta(apiResult.meta);
    setScorecard((prev) => applyDelta(prev, apiResult.meta.scoreDelta));
    await runTwoLayerQuality({
      source: apiResult.source,
      signals: apiResult.meta.signals,
      transport,
      userTurns: userTurnCount,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const startFresh = () => {
    setMessages([]);
    setInput('');
    setShowLeadCta(false);
    setIsStreamingReply(false);
    setLastAssistantMeta(null);
    setQualityReport(null);
    setQualityError('');
    setScorecard({
      accuracy: 58,
      safety: 64,
      handoff: 52,
      setupFit: 54,
    });
    bucketIndexRef.current = {};
    lastTopicRef.current = null;
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const sourceLabel = (source?: ReplySource) => {
    if (source === 'model') return 'Live model';
    if (source === 'rule') return 'Product rule';
    return 'Safe preview';
  };

  const isBusy = isLoading || isStreamingReply;
  const isSendingDisabled = !input.trim() || isBusy;
  const userTurns = messages.filter((m) => m.role === 'user').length;
  const scoreRows: Array<{
    key: 'accuracy' | 'safety' | 'handoff' | 'setup-fit';
    label: string;
    value: number;
    rationale: string;
  }> = [
    {
      key: 'accuracy',
      label: 'Accuracy',
      value: scorecard.accuracy,
      rationale:
        lastAssistantMeta?.rationale.accuracy ||
        'Accuracy grows with specific and relevant product answers.',
    },
    {
      key: 'safety',
      label: 'Safety',
      value: scorecard.safety,
      rationale:
        lastAssistantMeta?.rationale.safety ||
        'Safety reflects clear expectations and non-deceptive demo behavior.',
    },
    {
      key: 'handoff',
      label: 'Handoff',
      value: scorecard.handoff,
      rationale:
        lastAssistantMeta?.rationale.handoff ||
        'Handoff improves when escalation to a human is explicit.',
    },
    {
      key: 'setup-fit',
      label: 'Setup fit',
      value: scorecard.setupFit,
      rationale:
        lastAssistantMeta?.rationale.setupFit ||
        'Setup fit increases when the assistant maps to concrete onboarding steps.',
    },
  ];

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
                Marketing preview. Evaluate answer quality, handoff behavior, and setup fit for your store.
              </div>
            </div>
          </div>
          <div className="demo-chat-header-actions">
            <span className="demo-chat-pill">Live demo</span>
            <button type="button" className="demo-chat-reset" onClick={startFresh}>
              New chat
            </button>
          </div>
        </header>

        {/* Body */}
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

          <div className="demo-scorecard" aria-label="Merchant scorecard">
            <div className="demo-scorecard-head">
              <strong>Merchant scorecard</strong>
              <span>Live demo heuristic</span>
            </div>
            <div className="demo-score-grid">
              {scoreRows.map(({ key, label, value, rationale }) => (
                <div key={label} className="demo-score-item">
                  <div className="demo-score-meta">
                    <span className="demo-score-label-wrap">
                      <span>{label}</span>
                      <button
                        type="button"
                        className="demo-score-help"
                        title={rationale}
                        aria-label={`${label} rationale`}
                      >
                        ?
                      </button>
                    </span>
                    <span>{value}/100</span>
                  </div>
                  <div className="demo-score-track">
                    <span
                      className={`demo-score-fill demo-score-fill--${key}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="demo-two-layer" aria-label="Two-layer quality health">
            <div className="demo-two-layer-head">
              <strong>Two-layer quality</strong>
              <span>Transport + conversation</span>
            </div>
            {qualityReport ? (
              <>
                <div className="demo-two-layer-scores">
                  <span>Transport: {qualityReport.scores.transport}</span>
                  <span>Conversation: {qualityReport.scores.conversation}</span>
                  <span>Overall: {qualityReport.scores.overall}</span>
                  <span className={`demo-two-layer-grade grade-${qualityReport.grade}`}>
                    Grade {qualityReport.grade}
                  </span>
                </div>
                <p className="demo-two-layer-note">
                  {qualityReport.reasons[0] ||
                    'Quality report updates after each assistant turn.'}
                </p>
              </>
            ) : (
              <p className="demo-two-layer-note">
                Send a message to generate transport + conversation quality scoring.
              </p>
            )}
            {qualityError ? <p className="demo-two-layer-error">{qualityError}</p> : null}
          </div>

          <div className="demo-chat-messages">
            {/* Static intro bubble */}
            <div className="demo-chat-row">
              <div className="demo-chat-bubble demo-chat-bubble--assistant">
                <p>
                  Ask about orders, shipping, returns, or sizing - or ask how I would work
                  in your own store. I will answer like I would in the real product, but
                  using safe sample data in this preview.
                </p>
                <p className="demo-chat-note">
                  In a real workspace I connect to your platform (for example Shopify),
                  read your policies, products, and past tickets, and handle routine
                  questions 24/7 while passing edge cases to your human team.
                </p>
                <p className="demo-chat-note">
                  If you do not have a website yet, ask about Starter Link to see how
                  TikoZap can run support before you install a widget.
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
                    {!isUser ? (
                      <div className="demo-chat-meta">
                        <span className="demo-chat-source">{sourceLabel(msg.source)}</span>
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
              <div className="demo-chat-row demo-chat-row--assistant">
                <div className="demo-chat-cta">
                  <strong>Want this running on your store?</strong>
                  <p>
                    Start a free 14-day Pro trial and connect your policies, products,
                    and channels in one workspace.
                  </p>
                  <div className="demo-chat-cta-actions">
                    <a className="demo-chat-cta-btn primary" href="/signup?plan=pro">
                      Start free trial
                    </a>
                    <a className="demo-chat-cta-btn" href="/pricing">
                      View pricing
                    </a>
                  </div>
                </div>
              </div>
            )}

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
          padding: 0.2rem 0.55rem;
          cursor: pointer;
        }

        .demo-chat-reset:hover {
          background: #f3f4f6;
        }

        .demo-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 0.9rem 1rem 0.6rem;
          background: #f9fafb;
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
          padding: 0.28rem 0.55rem;
          cursor: pointer;
          max-width: 100%;
          text-align: left;
        }

        .demo-chat-prompt:hover {
          background: #f8fafc;
        }

        .demo-chat-prompt:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .demo-scorecard {
          border-bottom: 1px solid #eef2f7;
          background: #ffffff;
          padding: 0.55rem 0.8rem 0.65rem;
        }

        .demo-scorecard-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.45rem;
        }

        .demo-scorecard-head strong {
          font-size: 0.78rem;
          color: #111827;
        }

        .demo-scorecard-head span {
          font-size: 0.68rem;
          color: #6b7280;
        }

        .demo-score-grid {
          display: grid;
          gap: 0.36rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .demo-score-item {
          border: 1px solid #eef2f7;
          border-radius: 10px;
          padding: 0.35rem 0.45rem;
          background: #f9fafb;
        }

        .demo-score-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.68rem;
          color: #374151;
          margin-bottom: 0.2rem;
        }

        .demo-score-label-wrap {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
        }

        .demo-score-help {
          border: 1px solid #d1d5db;
          background: #ffffff;
          border-radius: 999px;
          width: 0.95rem;
          height: 0.95rem;
          font-size: 0.62rem;
          line-height: 1;
          color: #64748b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: help;
          padding: 0;
        }

        .demo-score-track {
          width: 100%;
          height: 0.32rem;
          border-radius: 999px;
          background: #e5e7eb;
          overflow: hidden;
        }

        .demo-score-fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #93c5fd 0%, #2563eb 100%);
          transition: width 240ms ease;
        }

        .demo-score-fill--accuracy {
          background: linear-gradient(90deg, #93c5fd 0%, #2563eb 100%);
        }

        .demo-score-fill--safety {
          background: linear-gradient(90deg, #86efac 0%, #16a34a 100%);
        }

        .demo-score-fill--handoff {
          background: linear-gradient(90deg, #fdba74 0%, #ea580c 100%);
        }

        .demo-score-fill--setup-fit {
          background: linear-gradient(90deg, #c4b5fd 0%, #7c3aed 100%);
        }

        .demo-two-layer {
          border-bottom: 1px solid #eef2f7;
          background: #ffffff;
          padding: 0.45rem 0.8rem 0.6rem;
        }

        .demo-two-layer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.3rem;
        }

        .demo-two-layer-head strong {
          font-size: 0.76rem;
          color: #111827;
        }

        .demo-two-layer-head span {
          font-size: 0.67rem;
          color: #6b7280;
        }

        .demo-two-layer-scores {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .demo-two-layer-scores span {
          font-size: 0.68rem;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 0.12rem 0.42rem;
          color: #334155;
          background: #f9fafb;
        }

        .demo-two-layer-grade {
          font-weight: 600;
        }

        .demo-two-layer-grade.grade-A {
          color: #166534;
          border-color: #86efac;
          background: #f0fdf4;
        }

        .demo-two-layer-grade.grade-B {
          color: #1d4ed8;
          border-color: #93c5fd;
          background: #eff6ff;
        }

        .demo-two-layer-grade.grade-C {
          color: #92400e;
          border-color: #fcd34d;
          background: #fffbeb;
        }

        .demo-two-layer-grade.grade-D {
          color: #991b1b;
          border-color: #fca5a5;
          background: #fef2f2;
        }

        .demo-two-layer-note {
          margin-top: 0.3rem;
          font-size: 0.72rem;
          color: #475569;
        }

        .demo-two-layer-error {
          margin-top: 0.2rem;
          font-size: 0.7rem;
          color: #b91c1c;
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

        .demo-chat-meta {
          margin-top: 0.4rem;
        }

        .demo-chat-source {
          display: inline-flex;
          font-size: 0.68rem;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 0.13rem 0.4rem;
          color: #6b7280;
          background: #f9fafb;
        }

        .demo-chat-bubble--typing {
          display: inline-flex;
          gap: 0.22rem;
          align-items: center;
          min-width: 3rem;
          justify-content: center;
          padding-top: 0.6rem;
          padding-bottom: 0.6rem;
        }

        .typing-dot {
          width: 0.38rem;
          height: 0.38rem;
          border-radius: 999px;
          background: #9ca3af;
          animation: demo-typing 1s infinite ease-in-out;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes demo-typing {
          0%,
          80%,
          100% {
            opacity: 0.35;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }

        .demo-chat-cta {
          max-width: 88%;
          border: 1px solid #dbeafe;
          background: #eff6ff;
          border-radius: 1rem;
          padding: 0.7rem 0.8rem;
        }

        .demo-chat-cta p {
          margin-top: 0.3rem;
          font-size: 0.84rem;
          color: #334155;
        }

        .demo-chat-cta-actions {
          margin-top: 0.45rem;
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .demo-chat-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.76rem;
          border-radius: 999px;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          text-decoration: none;
          padding: 0.3rem 0.58rem;
          background: #ffffff;
        }

        .demo-chat-cta-btn.primary {
          background: #1d4ed8;
          color: #ffffff;
          border-color: #1d4ed8;
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

          .demo-score-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
      `}</style>
    </section>
  );
}

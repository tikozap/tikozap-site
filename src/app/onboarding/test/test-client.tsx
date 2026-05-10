// src/app/onboarding/test/test-client.tsx

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import FinishOnboarding from '../_components/FinishOnboarding';
import OnboardingNav from '../_components/OnboardingNav';

type Msg = {
  id?: string;
  role: 'customer' | 'assistant' | 'staff' | 'note';
  content: string;
  createdAt?: string;
};

const ACTIVATION_EVENT_SENT_TEST_MESSAGE = 'activation_sent_test_message';

const SUGGESTED_PROMPTS = [
  'Where is my order?',
  'What is your return policy?',
  'Do you have this in another size?',
];

export default function OnboardingTestClient({
  widgetPublicKey,
  storeName,
  tenantSlug,
}: {
  widgetPublicKey: string;
  storeName: string;
  tenantSlug: string;
}) {
  const storageKey = useMemo(() => `tz_onboarding_convo_${tenantSlug}`, [tenantSlug]);

  const [conversationId, setConversationId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(storageKey) || '';
  });

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content: `Hi! Welcome to ${storeName}. Ask me about orders, shipping, returns, or sizing.`,
    },
  ]);

  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasTrackedTestMessage, setHasTrackedTestMessage] = useState(false);

  async function trackActivation(event: string) {
    try {
      await fetch('/api/onboarding/activation', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event }),
      });
    } catch {}
  }

  async function send(customText?: string) {
    const t = (customText ?? text).trim();
    if (!t || busy) return;

    setBusy(true);
    setText('');

    setMessages((m) => [...m, { role: 'customer', content: t }]);

    try {
      const res = await fetch('/api/widget/message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          key: widgetPublicKey,
          customerName: 'Test customer',
          conversationId: conversationId || undefined,
          text: t,
          channel: 'onboarding',
          subject: 'Onboarding test message',
          aiEnabled: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Request failed');

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        window.localStorage.setItem(storageKey, data.conversationId);
      }

      if (Array.isArray(data.messages) && data.messages.length) {
        setMessages(data.messages);
      }

      if (!hasTrackedTestMessage) {
        setHasTrackedTestMessage(true);
        void trackActivation(ACTIVATION_EVENT_SENT_TEST_MESSAGE);
      }
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: `Sorry—something went wrong sending that message. (${e?.message || 'error'})`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function resetThread() {
    setConversationId('');
    window.localStorage.removeItem(storageKey);
    setMessages([
      {
        role: 'assistant',
        content: `Hi! Welcome to ${storeName}. Ask me about orders, shipping, returns, or sizing.`,
      },
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <div className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Final step
        </div>

        <h2 className="text-xl font-semibold tracking-tight">Send your first test message</h2>

        <p className="text-sm leading-6 opacity-80">
          Ask a real customer question below. Then open Inbox to confirm the conversation appears
          for your team.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div>
            <div className="text-sm font-semibold">Test your assistant</div>
            <p className="mt-1 text-xs leading-5 opacity-75">
              This sends a shopper-style message to your Inbox.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-60">
              Store
            </div>
            <div className="mt-2 text-sm font-medium">{storeName}</div>
          </div>

          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-60">
              Try these questions
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  disabled={busy}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-1.5">
            <span className="text-sm font-medium">Message</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="min-h-[120px] w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
              placeholder="Type as a customer…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetThread}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
              >
                New thread
              </button>

              <Link
                href="/dashboard/conversations"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-black"
              >
                Open Inbox
              </Link>
            </div>

            <button
              type="button"
              onClick={() => send()}
              disabled={busy}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send'}
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-semibold">Success looks like this</div>
            <div className="mt-3 grid gap-3 text-sm text-zinc-700">
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                Your assistant responds clearly
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                The conversation appears in Inbox
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                Your team can take over if needed
              </div>
            </div>
          </div>

          <div className="mt-5">
            <FinishOnboarding />
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <div className="text-sm font-semibold">Customer-side preview</div>
            <p className="mt-1 text-xs opacity-75">
              This shows how the conversation feels to a shopper.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="h-[360px] space-y-3 overflow-auto rounded-xl bg-zinc-50">
              {messages.length ? (
                messages.map((m, idx) => (
                  <div
                    key={m.id ?? idx}
                    className={`flex ${
                      m.role === 'customer' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={[
                        'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                        m.role === 'customer'
                          ? 'bg-zinc-900 text-white'
                          : 'border border-zinc-200 bg-white text-zinc-800',
                      ].join(' ')}
                    >
                      <div className="mb-1 text-[11px] opacity-70">
                        {m.role === 'customer'
                          ? 'Customer'
                          : m.role === 'assistant'
                            ? 'Assistant'
                            : m.role}
                      </div>
                      <div>{m.content}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white">
                  No messages yet. Send one on the left.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <OnboardingNav
        backHref="/onboarding/install"
        nextHref="/dashboard/conversations"
        nextLabel="Go to Inbox"
      />
    </div>
  );
}
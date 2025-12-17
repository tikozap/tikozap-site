'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Msg = { id?: string; role: 'customer' | 'assistant' | 'staff' | 'note'; content: string; createdAt?: string };

export default function DashboardWidgetTestPage() {
  const storageKey = useMemo(() => `tz_widget_test_convo_id`, []);
  const [customerName, setCustomerName] = useState('Sophia (Widget Test)');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Msg[]>([]);

  // restore last thread so you can "View in Inbox" and see the exact match
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
    if (saved) setConversationId(saved);
  }, [storageKey]);

  async function send() {
    const t = text.trim();
    if (!t || busy) return;

    setBusy(true);
    setText('');

    // optimistic UI
    setMessages((m) => [...m, { role: 'customer', content: t }]);

    try {
      const res = await fetch('/api/widget/message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customerName,
          text: t,
          conversationId: conversationId || undefined,
          channel: 'web',
          subject: 'Widget test',
          tags: 'widget-test',
          aiEnabled: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Request failed');

      if (data.conversationId) {
        setConversationId(data.conversationId);
        window.localStorage.setItem(storageKey, data.conversationId);
      }

      if (Array.isArray(data.messages)) setMessages(data.messages);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Sorry—failed to send. (${e?.message || 'error'})` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function startNewTestChat() {
    setConversationId('');
    window.localStorage.removeItem(storageKey);
    setMessages([]);
  }

  const inboxHref = conversationId
    ? `/dashboard/conversations?cid=${encodeURIComponent(conversationId)}`
    : `/dashboard/conversations`;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Widget test</h2>
          <p className="text-sm opacity-80">
            This simulates customer messages and writes them to the Inbox (DB).
          </p>
          <p className="mt-1 text-xs opacity-70">
            Latest conversation id:{' '}
            <span className="font-mono">{conversationId || '(new)'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startNewTestChat}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Start new test chat
          </button>

          <Link
            href={inboxHref}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-black"
          >
            View in Inbox
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Send a widget message</h3>

          <label className="mt-3 block text-sm opacity-80">Customer name</label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />

          <label className="mt-3 block text-sm opacity-80">Message</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type as a customer..."
            className="mt-1 h-28 w-full rounded-xl border px-3 py-2 text-sm"
          />

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={send}
              disabled={busy}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              Send
            </button>
          </div>

          <p className="mt-2 text-xs opacity-70">
            Tip: after sending, click <b>View in Inbox</b> — it opens the exact conversation thread.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Widget preview</h3>

          <div className="mt-3 h-[420px] space-y-3 overflow-auto rounded-xl bg-zinc-50 p-3">
            {messages.length === 0 ? (
              <div className="text-sm opacity-70">No messages yet. Send one on the left.</div>
            ) : (
              messages.map((m, idx) => (
                <div key={m.id ?? idx} className={`flex ${m.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={[
                      'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                      m.role === 'customer' ? 'bg-zinc-900 text-white' : 'bg-white border',
                    ].join(' ')}
                  >
                    <div className="mb-1 text-[11px] opacity-70">
                      {m.role === 'customer' ? 'Customer' : m.role === 'assistant' ? 'Assistant' : m.role}
                    </div>
                    <div>{m.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

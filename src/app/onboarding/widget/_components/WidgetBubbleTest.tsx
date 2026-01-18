'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type Msg = { id?: string; role: 'customer' | 'assistant'; content: string };

const KEY_CID = 'tz_onboarding_widget_test_cid';

export default function WidgetBubbleTest({
  enabled,
  assistantName,
  greeting,
  brandColor,
}: {
  enabled: boolean;
  assistantName: string;
  greeting: string;
  brandColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cid = localStorage.getItem(KEY_CID) || '';
    setConversationId(cid);
    setMessages(greeting ? [{ role: 'assistant', content: greeting }] : []);
  }, [greeting]);

  useEffect(() => {
    const t = setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 0);
    return () => clearTimeout(t);
  }, [messages.length, open]);

  const safeColor = useMemo(() => {
    const raw = (brandColor || '').trim();
    const v = raw.startsWith('#') ? raw : `#${raw}`;
    return /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#111111';
  }, [brandColor]);

  async function send() {
    const msg = text.trim();
    if (!msg || busy) return;

    setBusy(true);
    setText('');
    setMessages((m) => [...m, { role: 'customer', content: msg }]);

    try {
      const res = await fetch('/api/widget/message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Widget Test (Onboarding)',
          subject: 'Widget onboarding test',
          channel: 'web',
          tags: 'widget-test',
          aiEnabled: true,
          text: msg,
          conversationId: conversationId || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Send failed');

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem(KEY_CID, data.conversationId);
      }

      if (Array.isArray(data.messages)) {
        setMessages(
          data.messages
            .filter((x: any) => x?.role === 'customer' || x?.role === 'assistant')
            .map((x: any) => ({ role: x.role, content: x.content })),
        );
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: 'Got it ✅' }]);
      }
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Sorry—failed to send. (${e?.message || 'error'})` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    localStorage.removeItem(KEY_CID);
    setConversationId('');
    setMessages(greeting ? [{ role: 'assistant', content: greeting }] : []);
  }

  const inboxHref = conversationId
    ? `/dashboard/conversations?cid=${encodeURIComponent(conversationId)}`
    : '/dashboard/conversations';

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
        Bubble is currently <b>disabled</b>. Turn on “Chat bubble enabled” to test it.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: 360 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Close chat' : 'Open chat'}
        style={{
          position: 'absolute',
          right: 14,
          bottom: 14,
          width: 54,
          height: 54,
          borderRadius: 999,
          border: '1px solid rgba(0,0,0,.12)',
          background: safeColor,
          color: '#fff',
          fontWeight: 800,
        }}
      >
        {open ? '×' : '💬'}
      </button>

      {open ? (
        <div
          style={{
            position: 'absolute',
            right: 14,
            bottom: 78,
            width: 340,
            maxWidth: 'calc(100% - 28px)',
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            background: '#fff',
            overflow: 'hidden',
            boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 13 }}>{assistantName || 'Store Assistant'}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Test bubble (writes to Inbox)</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                onClick={reset}
                style={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 10, padding: '6px 8px', background: '#fff' }}
              >
                Reset
              </button>
              <Link
                href={inboxHref}
                style={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 10, padding: '6px 8px', textDecoration: 'none' }}
              >
                Inbox
              </Link>
            </div>
          </div>

          <div ref={scrollRef} style={{ height: 240, overflowY: 'auto', padding: 12, background: '#f8fafc' }}>
            {messages.map((m, idx) => {
              const isCustomer = m.role === 'customer';
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: isCustomer ? 'flex-end' : 'flex-start', margin: '8px 0' }}>
                  <div
                    style={{
                      maxWidth: '85%',
                      borderRadius: 14,
                      padding: '10px 12px',
                      fontSize: 13,
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap',
                      border: '1px solid #e5e7eb',
                      background: isCustomer ? '#fff' : '#111827',
                      color: isCustomer ? '#111827' : '#fff',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div style={{ padding: 10, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
            {/* Tap-to-speak placeholder (wire later) */}
            <button
              type="button"
              disabled
              title="Tap-to-speak (coming soon)"
              style={{
                width: 40,
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: '#fff',
                opacity: 0.6,
              }}
            >
              🎙️
            </button>

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              style={{
                flex: 1,
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                padding: '10px 12px',
                fontSize: 13,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
            />
            <button
              type="button"
              onClick={send}
              disabled={busy}
              style={{
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                padding: '10px 12px',
                background: busy ? '#f3f4f6' : '#111827',
                color: busy ? '#6b7280' : '#fff',
                fontWeight: 800,
              }}
            >
              Send
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

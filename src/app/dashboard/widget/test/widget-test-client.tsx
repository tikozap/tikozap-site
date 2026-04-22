// src/app/dashboard/widget/test/widget-test-client.tsx

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MobilePageHeader from '../../_components/MobilePageHeader';

const KEY_CONVO_ID = 'tz_widget_test_conversation_id_v2';
const KEY_CUSTOMER = 'tz_widget_test_customer';

type Product = {
  id?: string | number;
  title?: string;
  price?: number | string;
  image?: string | null;
  available?: boolean;
  url?: string;
};

type Msg = {
  id?: string;
  role: string;
  content: string;
  createdAt?: string;
  products?: Product[];
};

export default function WidgetTestClient() {
  const [customer, setCustomer] = useState('Sophia (Widget Test)');
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const cid = localStorage.getItem(KEY_CONVO_ID) || '';
    const cname = localStorage.getItem(KEY_CUSTOMER) || 'Sophia (Widget Test)';
    setConversationId(cid);
    setCustomer(cname);
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY_CUSTOMER, customer);
  }, [customer]);

  async function send() {
    const text = message.trim();
    if (!text || busy) return;

    setBusy(true);
    setMessage('');

    try {
      const res = await fetch('/api/widget/message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customerName: customer || 'Sophia (Widget Test)',
          subject: 'Widget test',
          channel: 'web',
          tags: '',
          aiEnabled: true,
          text,
          conversationId: conversationId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Request failed');
      }

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem(KEY_CONVO_ID, data.conversationId);
      }

      const assistantProducts = Array.isArray(data.products) ? data.products : [];

      if (Array.isArray(data.messages)) {
        const nextMessages = data.messages.map((m: Msg, idx: number) => {
          const isLastAssistant =
            m.role === 'assistant' &&
            idx === data.messages.length - 1 &&
            assistantProducts.length > 0;

          return isLastAssistant
            ? { ...m, products: assistantProducts }
            : m;
        });

        setMessages(nextMessages);
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

  function startNew() {
    setConversationId('');
    localStorage.removeItem(KEY_CONVO_ID);
    setMessages([]);
  }

  const inboxHref = conversationId
    ? `/dashboard/conversations?cid=${encodeURIComponent(conversationId)}`
    : '/dashboard/conversations';

  const preview = useMemo(() => {
    if (!messages.length) {
      return [{ role: 'assistant', content: 'No messages yet. Send one on the left.' }];
    }
    return messages;
  }, [messages]);

  return (
  <div>
    <MobilePageHeader title="Widget" />

    <div className="db-top">
        <div>
          <h1 className="db-title">Widget test</h1>
          <p className="db-sub">This simulates customer messages and writes them to the Inbox.</p>
          <p className="db-sub" style={{ marginTop: 6 }}>
            Latest conversation id: <code>{conversationId || '(new)'}</code>
          </p>
        </div>

        <div className="db-actions">
          <button className="db-btn primary" onClick={startNew}>Start new test chat</button>
          <Link className="db-btn" href={inboxHref}>View in Inbox</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 12 }}>
        <div className="db-card" style={{ padding: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Send a widget message</div>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>Customer name</span>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="cx-textarea"
              style={{ height: 42, resize: 'none' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="cx-textarea"
              placeholder="Type as a customer…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
              }}
            />
          </label>

          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            <button className="db-btn primary" onClick={send} disabled={busy}>
              {busy ? 'Sending…' : 'Send'}
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
            Tip: after sending, click <strong>View in Inbox</strong> — it opens the exact conversation thread.
          </div>
        </div>

        <div className="db-card" style={{ padding: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Widget preview</div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: 14, background: '#f8fafc', minHeight: 220 }}>
            {preview.map((m, idx: number) => (
              <div key={m.id ?? idx} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                  <strong style={{ textTransform: 'capitalize' }}>{m.role}</strong>
                </div>

                <div
                  style={{
                    borderRadius: 14,
                    padding: 12,
                    border: '1px solid #e5e7eb',
                    background: m.role === 'customer' ? '#fff' : '#111827',
                    color: m.role === 'customer' ? '#111827' : '#fff',
                    fontSize: 13,
                    lineHeight: 1.45,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.content}
                </div>

                {Array.isArray(m.products) && m.products.length > 0 ? (
                  <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                    {m.products.map((p, pIdx) => {
                      const priceText =
                        typeof p.price === 'number'
                          ? `$${p.price.toFixed(2)}`
                          : p.price
                            ? String(p.price)
                            : '';

                      const stockText =
                        p.available === false ? 'Unavailable' : 'In stock';

                      return (
                        <div
                          key={p.id ?? pIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            padding: 10,
                            border: '1px solid #e5e7eb',
                            borderRadius: 12,
                            background: '#fff',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.title || 'Product'}
                                style={{
                                  width: 52,
                                  height: 52,
                                  objectFit: 'cover',
                                  borderRadius: 10,
                                  border: '1px solid #e5e7eb',
                                  background: '#f3f4f6',
                                  flex: '0 0 52px',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 10,
                                  border: '1px solid #e5e7eb',
                                  background: '#f3f4f6',
                                  flex: '0 0 52px',
                                }}
                              />
                            )}

                            <div style={{ minWidth: 0, display: 'grid', gap: 4 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>
                                {p.title || 'Product'}
                              </div>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>
                                {stockText}
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                            {priceText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1000px) {
          div[style*="grid-template-columns: 420px 1fr"] {
            grid-template-columns: 1fr !important;
          }

          .db-title {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
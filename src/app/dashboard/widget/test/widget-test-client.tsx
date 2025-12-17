'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const KEY_CONVO_ID = 'tz_widget_test_conversation_id';
const KEY_CUSTOMER = 'tz_widget_test_customer';

type Msg = { id?: string; role: string; content: string; createdAt?: string };

export default function WidgetTestClient() {
  const [customer, setCustomer] = useState('Sophia (Widget Test)');
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);

  // restore convo + customer
  useEffect(() => {
    const cid = localStorage.getItem(KEY_CONVO_ID) || '';
    const cname = localStorage.getItem(KEY_CUSTOMER) || 'Sophia (Widget Test)';
    setConversationId(cid);
    setCustomer(cname);
  }, []);

  // persist customer
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
          tags: 'widget-test',
          aiEnabled: true, // server enforces per-conversation authority anyway
          text,

          // ✅ critical: reuse same conversation
          conversationId: conversationId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Request failed');

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem(KEY_CONVO_ID, data.conversationId);
      }

      if (Array.isArray(data.messages)) setMessages(data.messages);
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `Sorry—failed to send. (${e?.message || 'error'})` }]);
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
    if (!messages.length) return [{ role: 'assistant', content: 'No messages yet. Send one on the left.' }];
    return messages;
  }, [messages]);

  return (
    <div>
      <div className="db-top">
        <div>
          <h1 className="db-title">Widget test</h1>
          <p className="db-sub">This simulates customer messages and writes them to the Inbox (DB).</p>
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
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
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
            {preview.map((m, idx) => (
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
        }
      `}</style>
    </div>
  );
}

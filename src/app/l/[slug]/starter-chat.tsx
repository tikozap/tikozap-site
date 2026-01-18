'use client';

import { useEffect, useRef, useState } from 'react';

type Msg = { role: string; content: string };

export default function StarterChat({
  slug,
  greeting,
}: {
  slug: string;
  greeting: string;
}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: greeting },
  ]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`tz_conv_${slug}`);
    if (saved) setConversationId(saved);
  }, [slug]);

  // ✅ Always keep the latest message visible
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  async function refresh(id: string) {
    const res = await fetch(`/api/l/${slug}/conversation/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return;
    const data = await res.json();
    const rest = (data.messages as Msg[]) ?? [];
    setMessages([{ role: 'assistant', content: greeting }, ...rest]);
  }

  async function send() {
    const content = text.trim();
    if (!content || sending) return;

    setText('');
    setSending(true);

    // optimistic bubble
    setMessages((m) => [...m, { role: 'customer', content }]);

    const payload: { content: string; conversationId?: string } = { content };
    if (conversationId) payload.conversationId = conversationId;

    const res = await fetch(`/api/l/${slug}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSending(false);

    if (!res.ok) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'Sorry—something went wrong. Please try again.',
        },
      ]);
      return;
    }

    const data = await res.json();
    const id = data.conversationId as string;
    setConversationId(id);
    localStorage.setItem(`tz_conv_${slug}`, id);
    await refresh(id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 440 }}>
      {/* messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
        }}
      >
        {messages.map((m, i) => {
          const isCustomer = m.role === 'customer';
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: isCustomer ? 'flex-end' : 'flex-start',
                margin: '10px 0',
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 14,
                  border: '1px solid #e5e7eb',
                  maxWidth: '85%',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          paddingTop: 10,
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type your message…"
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
          }}
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            cursor: sending ? 'not-allowed' : 'pointer',
            opacity: sending ? 0.7 : 1,
          }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

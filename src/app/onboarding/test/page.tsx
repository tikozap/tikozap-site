// src/app/onboarding/test/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import FinishOnboarding from '../_components/FinishOnboarding';

type Msg = { id?: string; role: 'customer' | 'assistant' | 'staff' | 'note'; content: string; createdAt?: string };

type WidgetSettings = {
  publicKey: string;
  installedAt: string | null;
};

const KEY_TENANT_NAME = 'tz_demo_tenant_name';
const KEY_TENANT_SLUG = 'tz_demo_tenant_slug';

export default function OnboardingTestPage() {
  const [tenantSlug, setTenantSlug] = useState('three-tree-fashion');
  const [storeName, setStoreName] = useState('Three Tree Fashion');

  // Per-tenant conversation thread for this test page
  const storageKey = useMemo(() => `tz_widget_convo_${tenantSlug}`, [tenantSlug]);

  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: `Hi! Welcome to ${storeName}. Ask me about orders, shipping, returns, or sizing.` },
  ]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  // Real widget embed test
  const [publicKey, setPublicKey] = useState('');
  const [widgetError, setWidgetError] = useState('');
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const injectedRef = useRef(false);

  // 1) Pull tenant context from demo storage (set by /demo-login quick start)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = window.localStorage.getItem(KEY_TENANT_SLUG);
    const n = window.localStorage.getItem(KEY_TENANT_NAME);
    if (s) setTenantSlug(s);
    if (n) setStoreName(n);
  }, []);

  // 2) Ensure tenant exists in DB so widget messages appear in /dashboard/conversations
  useEffect(() => {
    if (!tenantSlug) return;
    fetch('/api/demo/bootstrap', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenantName: storeName, tenantSlug }),
    }).catch(() => {});
  }, [tenantSlug, storeName]);

  // 3) Restore saved thread id for this tenant
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
    if (saved) setConversationId(saved);
  }, [storageKey]);

  // 4) Load widget publicKey for real embed test
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setWidgetError('');
        const res = await fetch('/api/widget/settings', { method: 'GET' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to load widget settings');

        if (!alive) return;
        const w = data.widget as WidgetSettings;
        setPublicKey(w?.publicKey || '');
      } catch (e: any) {
        if (!alive) return;
        setWidgetError(e?.message || 'Failed to load widget key');
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const embedSnippet = useMemo(() => {
    const key = publicKey || 'YOUR_PUBLIC_KEY';
    return `<!-- TikoZap Widget -->
<script async
  src="https://js.tikozap.com/widget.js"
  data-tikozap-key="${key}">
</script>`;
  }, [publicKey]);

  function injectWidget() {
    if (!publicKey) return;
    if (injectedRef.current) return;

    injectedRef.current = true;
    setWidgetError('');

    // Remove any existing widget script tag (defensive)
    const existing = document.querySelector('script[data-tikozap-key]');
    if (existing) existing.remove();

    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://js.tikozap.com/widget.js';
    s.setAttribute('data-tikozap-key', publicKey);

    s.onload = () => setWidgetLoaded(true);
    s.onerror = () => setWidgetError('Failed to load https://js.tikozap.com/widget.js');

    document.body.appendChild(s);
  }

  // Auto-inject once when we have a key (so you SEE the real widget on this page)
  useEffect(() => {
    if (publicKey) injectWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  async function send() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setText('');

    setMessages((m) => [...m, { role: 'customer', content: t }]);

    try {
      const res = await fetch('/api/widget/message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tenantSlug, // important: forces same tenant for demo path
          customerName: 'Web shopper',
          conversationId: conversationId || undefined,
          text: t,
          channel: 'web',
          subject: 'Onboarding widget test',
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
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Sorry—something went wrong sending that message. (${e?.message || 'error'})` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function resetThread() {
    setConversationId('');
    window.localStorage.removeItem(storageKey);
    setMessages([{ role: 'assistant', content: `Hi! Welcome to ${storeName}. Ask me about orders, shipping, returns, or sizing.` }]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Storefront chat preview</h2>
          <p className="text-sm opacity-80">
            This simulates a shopper chatting on your website. Messages are saved into the inbox (DB).
          </p>
          <p className="mt-1 text-xs opacity-70">
            Tenant: <span className="font-mono">{tenantSlug}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={resetThread} className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50">
            New thread
          </button>
          <Link href="/dashboard/conversations" className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-black">
            Open Inbox
          </Link>
        </div>
      </div>

      {/* Simulator */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="h-[360px] space-y-3 overflow-auto rounded-xl bg-zinc-50 p-3">
          {messages.map((m, idx) => (
            <div key={m.id ?? idx} className={`flex ${m.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={[
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                  m.role === 'customer' ? 'bg-zinc-900 text-white' : 'bg-white border',
                ].join(' ')}
              >
                <div className="mb-1 text-[11px] opacity-70">
                  {m.role === 'customer' ? 'Customer' : m.role === 'assistant' ? 'Assistant' : m.role}
                </div>
                <div>{m.content}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Ask about returns, shipping, order status, or sizing…"
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          <button
            onClick={send}
            disabled={busy}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Send
          </button>
        </div>

        <div className="mt-2 text-xs opacity-70">
          Current conversationId: <span className="font-mono">{conversationId || '(new)'}</span>
        </div>
      </div>

      {/* Real embed test */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Real widget embed test</h3>
            <p className="mt-1 text-xs opacity-70">
              This loads the real script from <span className="font-mono">js.tikozap.com</span> using your public key.
              You should see the 💬 bubble appear on this page.
            </p>
            <p className="mt-1 text-xs opacity-70">
              Public key: <span className="font-mono">{publicKey || '(loading...)'}</span>
            </p>
          </div>

          <button
            onClick={injectWidget}
            disabled={!publicKey}
            className="rounded-lg border px-3 py-2 text-xs hover:bg-zinc-50 disabled:opacity-60"
          >
            {widgetLoaded ? 'Widget loaded' : 'Load widget now'}
          </button>
        </div>

        {widgetError ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {widgetError}
          </div>
        ) : null}

        <div className="mt-3 rounded-xl border bg-zinc-50 p-3">
          <div className="text-xs font-semibold">Embed snippet</div>
          <pre className="mt-2 overflow-auto rounded-lg border bg-white p-3 text-[11px] leading-relaxed">
{embedSnippet}
          </pre>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <FinishOnboarding />
      </div>
    </div>
  );
}

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

// IMPORTANT: always point widget/public endpoints at the API host
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'https://api.tikozap.com').replace(/\/$/, '');

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

  // Signature guard to avoid re-render spam during polling
  const lastSigRef = useRef<string>('');

  // ---- Milestone 5: Tap-to-Speak status helpers ----
  const [speechLang, setSpeechLang] = useState<string>(''); // optional override (e.g. "en-US")
  const [speechSupported, setSpeechSupported] = useState(false);
  const [secureContext, setSecureContext] = useState(false);
  const [widgetIndicators, setWidgetIndicators] = useState({
    bubble: false,
    panel: false,
    mic: false,
  });

  function scanWidgetDom() {
    if (typeof document === 'undefined') return;
    setWidgetIndicators({
      bubble: !!document.querySelector('.tz-bubble'),
      panel: !!document.querySelector('.tz-panel'),
      mic: !!document.querySelector('.tz-mic'),
    });
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // SpeechRecognition support check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR);

    // Secure context check (Web Speech recognition generally requires https)
    const host = window.location?.hostname || '';
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    const isSecure =
      (typeof window.isSecureContext === 'boolean' ? window.isSecureContext : window.location?.protocol === 'https:') ||
      isLocalHost;
    setSecureContext(!!isSecure);
  }, []);
  // ---- end Milestone 5 helpers ----

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

    const langLine = (speechLang || '').trim()
      ? `  data-tikozap-lang="${(speechLang || '').trim()}"\n`
      : '';

    return `<!-- TikoZap Widget -->
<script async
  src="https://js.tikozap.com/widget.js"
  data-tikozap-key="${key}"
${langLine}  data-tikozap-api-base="${API_BASE}">
</script>`;
  }, [publicKey, speechLang]);

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
    s.setAttribute('data-tikozap-api-base', API_BASE);

    // Optional speech language override (Milestone 5)
    if ((speechLang || '').trim()) {
      s.setAttribute('data-tikozap-lang', (speechLang || '').trim());
    }

    s.onload = () => {
      setWidgetLoaded(true);
      // give widget a moment to render bubble/panel
      setTimeout(() => scanWidgetDom(), 50);
    };
    s.onerror = () => setWidgetError('Failed to load https://js.tikozap.com/widget.js');

    document.body.appendChild(s);
  }

  // Hard reset bubble thread (fixes "Conversation not found for tenant" immediately)
  function resetBubbleThread() {
    if (!publicKey) return;

    try {
      // Clear the widget’s stored conversation id
      window.localStorage.removeItem(`tz_widget_cid_${publicKey}`);

      // Remove widget DOM (bubble/panel) so it can re-init cleanly
      document.querySelectorAll('.tz-bubble, .tz-panel').forEach((el) => el.remove());

      // Remove injected widget script tag
      document.querySelectorAll('script[data-tikozap-key]').forEach((el) => el.remove());

      // Reset the widget "already loaded" guard
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__TIKOZAP_WIDGET_LOADED__;
    } catch {}

    injectedRef.current = false;
    setWidgetLoaded(false);
    setWidgetError('');
    setTimeout(() => {
      injectWidget();
      setTimeout(() => scanWidgetDom(), 100);
    }, 0);
  }

  // Auto-inject once when we have a key (so you SEE the real widget on this page)
  useEffect(() => {
    if (publicKey) injectWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  // Keep scanning widget DOM so the page shows whether mic/bubble exists
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = window.setInterval(() => scanWidgetDom(), 800);
    return () => window.clearInterval(t);
  }, []);

  async function syncThread() {
    if (!publicKey || !conversationId) return;

    try {
      const url = new URL(`${API_BASE}/api/widget/public/thread`);
      url.searchParams.set('key', publicKey);
      url.searchParams.set('conversationId', conversationId);
      url.searchParams.set('t', String(Date.now())); // avoid caches

      const res = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) return;

      const arr = Array.isArray(data.messages) ? data.messages : [];
      const filtered: Msg[] = arr
        .filter((x: any) => x && (x.role === 'customer' || x.role === 'assistant' || x.role === 'staff'))
        .map((x: any) => ({ id: x.id, role: x.role, content: x.content, createdAt: x.createdAt }));

      const sig = filtered.map((m) => `${m.role}:${m.content || ''}`).join('|');
      if (sig !== lastSigRef.current) {
        lastSigRef.current = sig;
        setMessages(filtered);
      }
    } catch {
      // ignore transient polling errors
    }
  }

  // Poll thread so staff replies appear in the simulator
  useEffect(() => {
    if (!publicKey || !conversationId) return;

    let alive = true;
    syncThread();

    const timer = window.setInterval(() => {
      if (!alive) return;
      syncThread();
    }, 2000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, conversationId]);

  async function send() {
    const t = text.trim();
    if (!t || busy) return;

    // Guard BEFORE setting busy, so we don't get stuck busy=true
    if (!publicKey) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry—widget public key not loaded yet.' }]);
      return;
    }

    setBusy(true);
    setText('');
    setMessages((m) => [...m, { role: 'customer', content: t }]);

    try {
      const res = await fetch(`${API_BASE}/api/widget/public/message`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          key: publicKey,
          customerName: 'Web shopper',
          conversationId: conversationId || undefined,
          text: t,
          channel: 'web',
          subject: 'Onboarding widget test',
          tags: 'onboarding',
          aiEnabled: true,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Request failed');

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        window.localStorage.setItem(storageKey, data.conversationId);
      }

      if (Array.isArray(data.messages) && data.messages.length) {
        const filtered: Msg[] = data.messages
          .filter((x: any) => x && (x.role === 'customer' || x.role === 'assistant' || x.role === 'staff'))
          .map((x: any) => ({ id: x.id, role: x.role, content: x.content, createdAt: x.createdAt }));

        lastSigRef.current = filtered.map((m) => `${m.role}:${m.content || ''}`).join('|');
        setMessages(filtered);
      }

      // One immediate sync so staff replies show ASAP if they already exist
      await syncThread();
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `Sorry—something went wrong. (${e?.message || 'error'})` }]);
    } finally {
      setBusy(false);
    }
  }

  function resetThread() {
    setConversationId('');
    window.localStorage.removeItem(storageKey);
    lastSigRef.current = '';
    setMessages([{ role: 'assistant', content: `Hi! Welcome to ${storeName}. Ask me about orders, shipping, returns, or sizing.` }]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Storefront chat preview</h2>
          <p className="text-sm opacity-80">This simulates a shopper chatting on your website. Messages are saved into the inbox (DB).</p>
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') send();
            }}
            placeholder="Ask about returns, shipping, order status, or sizing…"
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          <button onClick={send} disabled={busy} className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60">
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
            <p className="mt-1 text-xs opacity-70">
              API base: <span className="font-mono">{API_BASE}</span>
            </p>

            {/* Milestone 5: status block */}
            <div className="mt-3 rounded-xl border bg-zinc-50 p-3">
              <div className="text-xs font-semibold">Milestone 5 — Tap-to-Speak status</div>
              <div className="mt-2 grid gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>SpeechRecognition supported</span>
                  <span className={`font-mono ${speechSupported ? 'text-green-700' : 'text-red-700'}`}>
                    {speechSupported ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Secure context (https/localhost)</span>
                  <span className={`font-mono ${secureContext ? 'text-green-700' : 'text-red-700'}`}>
                    {secureContext ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Widget bubble present (.tz-bubble)</span>
                  <span className={`font-mono ${widgetIndicators.bubble ? 'text-green-700' : 'text-red-700'}`}>
                    {widgetIndicators.bubble ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Widget mic button present (.tz-mic)</span>
                  <span className={`font-mono ${widgetIndicators.mic ? 'text-green-700' : 'text-red-700'}`}>
                    {widgetIndicators.mic ? 'YES' : 'NO'}
                  </span>
                </div>

                <div className="mt-1">
                  <div className="text-[11px] opacity-70">
                    Tip: open the bubble → tap 🎤 → speak → text should appear in the widget input, then Send.
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <label className="text-[11px] opacity-70">Optional speech lang:</label>
                  <input
                    value={speechLang}
                    onChange={(e) => setSpeechLang(e.target.value)}
                    placeholder="e.g. en-US (blank = browser default)"
                    className="w-full rounded-lg border bg-white px-2 py-1 text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetBubbleThread}
              disabled={!publicKey}
              className="rounded-lg border px-3 py-2 text-xs hover:bg-zinc-50 disabled:opacity-60"
              title="Clears the widget's stored conversationId and reloads the widget"
            >
              Reset bubble thread
            </button>

            <button
              onClick={() => {
                injectWidget();
                setTimeout(() => scanWidgetDom(), 150);
              }}
              disabled={!publicKey}
              className="rounded-lg border px-3 py-2 text-xs hover:bg-zinc-50 disabled:opacity-60"
            >
              {widgetLoaded ? 'Widget loaded' : 'Load widget now'}
            </button>
          </div>
        </div>

        {widgetError ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{widgetError}</div>
        ) : null}

        <div className="mt-3 rounded-xl border bg-zinc-50 p-3">
          <div className="text-xs font-semibold">Embed snippet</div>
          <pre className="mt-2 overflow-auto rounded-lg border bg-white p-3 text-[11px] leading-relaxed">{embedSnippet}</pre>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <FinishOnboarding />
      </div>
    </div>
  );
}

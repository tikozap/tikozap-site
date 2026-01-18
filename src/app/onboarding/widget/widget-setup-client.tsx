'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Widget = {
  tenantId: string;
  publicKey: string;
  installedAt: string | null;
  assistantName: string | null;
  greeting: string | null;
  brandColor: string | null;
};

export default function WidgetSetupClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  const [assistantName, setAssistantName] = useState('Store Assistant');
  const [greeting, setGreeting] = useState('Hi! How can we help today?');
  const [brandColor, setBrandColor] = useState('#111111');

  const [publicKey, setPublicKey] = useState<string>('');

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch('/api/widget/settings', { method: 'GET' });
        const data = await res.json();

        if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to load widget settings');

        const w: Widget = data.widget;

        if (!alive) return;

        setPublicKey(w.publicKey || '');
        setAssistantName(w.assistantName || 'Store Assistant');
        setGreeting(w.greeting || 'Hi! How can we help today?');
        setBrandColor(w.brandColor || '#111111');
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'Failed to load');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function save(next?: boolean) {
    try {
      setSaving(true);
      setError('');

      const res = await fetch('/api/widget/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          assistantName: assistantName.trim() || null,
          greeting: greeting.trim() || null,
          brandColor: brandColor.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Save failed');

      const w: Widget = data.widget;
      setPublicKey(w.publicKey || publicKey);

      if (next) router.push('/onboarding/install');
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const previewHeader = useMemo(() => {
    const c = (brandColor || '#111111').startsWith('#') ? brandColor : `#${brandColor}`;
    return c;
  }, [brandColor]);

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {/* Left: form */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-sm opacity-70">Loading widget settings…</div>
        ) : null}

        {publicKey ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs">
            <div className="opacity-70">Widget public key</div>
            <code className="break-all">{publicKey}</code>
          </div>
        ) : null}

        <label className="grid gap-1">
          <span className="text-sm font-medium">Assistant name</span>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            value={assistantName}
            onChange={(e) => setAssistantName(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Greeting message</span>
          <textarea
            className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Brand color</span>
          <input
            type="text"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            placeholder="#111111"
          />
          <span className="text-xs opacity-70">Hex like #111111</span>
        </label>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm"
            onClick={() => router.push('/onboarding/knowledge')}
            disabled={saving}
          >
            Back
          </button>

          <button
            type="button"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm"
            onClick={() => save(false)}
            disabled={saving || loading}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>

          <button
            type="button"
            className="rounded-xl bg-black px-4 py-2 text-sm text-white"
            onClick={() => save(true)}
            disabled={saving || loading}
          >
            {saving ? 'Saving…' : 'Save & continue'}
          </button>
        </div>
      </div>

      {/* Right: live preview */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-semibold">Live preview</div>
        <p className="mt-1 text-xs opacity-80">This is the same “chat shell” style we’ll reuse later.</p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200">
          <div className="px-3 py-2 text-sm font-medium text-white" style={{ background: previewHeader }}>
            {assistantName || 'Store Assistant'}
            <div className="text-[11px] opacity-80">Online</div>
          </div>

          <div className="bg-zinc-50 p-4">
            <div className="inline-block max-w-[85%] rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm">
              {greeting || 'Hi! How can we help today?'}
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm opacity-70">
              Type a message…
            </div>

            <div className="mt-2 text-right">
              <button className="rounded-xl px-4 py-2 text-sm text-white" style={{ background: previewHeader }} disabled>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

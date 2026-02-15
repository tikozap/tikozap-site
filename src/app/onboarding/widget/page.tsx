// src/app/onboarding/widget/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingNav from '../_components/OnboardingNav';

type WidgetSettings = {
  tenantId: string;
  publicKey: string;
  installedAt: string | null;
  enabled: boolean;
  assistantName: string | null;
  greeting: string | null;
  brandColor: string | null;
};

export default function WidgetStep() {
  const router = useRouter();

  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [assistantName, setAssistantName] = useState('Store Assistant');
  const [greeting, setGreeting] = useState("Hi! How can we help today?");
  const [brandColor, setBrandColor] = useState('#111111');

  const [widget, setWidget] = useState<WidgetSettings | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/widget/settings', { method: 'GET' });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || 'Failed to load widget settings');
        }

        if (!alive) return;

        const w: WidgetSettings = data.widget;
        
	setWidget(w);
        setEnabled(w.enabled ?? true);
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

const previewColor = useMemo(() => {
  const raw = brandColor.trim();
  if (!raw) return '#111111';
  const v = raw.startsWith('#') ? raw : `#${raw}`;
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#111111';
}, [brandColor]);

  const previewTitle = useMemo(() => assistantName.trim() || 'Store Assistant', [assistantName]);
  const previewGreeting = useMemo(() => greeting.trim() || 'Hi! How can we help today?', [greeting]);

  async function save() {
    if (saving) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/widget/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
  enabled,
  assistantName: assistantName.trim() || null,
  greeting: greeting.trim() || null,
  brandColor: brandColor.trim() || null,
}),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to save');
      }

const w: WidgetSettings = data.widget;

setWidget(w);
setEnabled(w.enabled ?? true);
setAssistantName(w.assistantName || 'Store Assistant');
setGreeting(w.greeting || 'Hi! How can we help today?');
setBrandColor(w.brandColor || '#111111');

return true;

    } catch (e: any) {
      setError(e?.message || 'Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndNext() {
    const ok = await save();
    if (ok) router.push('/onboarding/install');
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Widget setup</h2>
          <p className="mt-1 text-sm opacity-80">
            Set the store assistant name, greeting, and basic appearance.
          </p>
        </div>

        <button
          onClick={saveAndNext}
          disabled={loading || saving}
          className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save & continue'}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Left: form */}
        <div className="grid gap-4">
          {/* ✅ toggle belongs here */}
          <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={loading || saving}
              className="h-4 w-4"
            />
            <div className="grid gap-0.5">
              <div className="text-sm font-semibold">Chat bubble enabled</div>
              <div className="text-xs opacity-70">
                If off, the chat bubble won’t appear on your site / Link page.
              </div>
            </div>
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Assistant name</span>
            <input
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              disabled={loading || saving}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Greeting message</span>
            <textarea
              className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              disabled={loading || saving}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Brand color</span>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              disabled={loading || saving}
            />
          </label>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm">
            <div className="font-semibold">Widget key</div>
            <div className="mt-2 break-all rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs">
              {widget?.publicKey || '(loading…)'}
            </div>
            <div className="mt-2 text-xs opacity-70">
              This public key will be used in the install snippet.
            </div>
          </div>
        </div>

        {/* Right: preview */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold">Live preview</div>
          <p className="mt-1 text-xs opacity-80">This will match the real widget bubble style later.</p>

          <div className="mt-4 rounded-2xl border border-zinc-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{previewTitle}</div>
              <div
                className="h-3 w-3 rounded-full"
                style={{ background: previewColor }}
                title="Brand color"
              />
            </div>

            <div className="mt-2 text-sm opacity-80">{previewGreeting}</div>

            <div className="mt-4 rounded-xl border border-zinc-200 px-3 py-2 text-sm opacity-70">
              Type a message…
            </div>

            <div className="mt-3 text-xs opacity-60">
              (Tap-to-speak will be added later—UI polish step.)
            </div>
          </div>

          {/* ✅ Test bubble belongs here */}
          <div className="mt-4">
          </div>
        </div>
      </div>


      {/* Keep your back/next nav; Next button can stay, but Save & Continue is the “real” action now */}
      <OnboardingNav backHref="/onboarding/knowledge" nextHref="/onboarding/install" />
    </div>
  );
}

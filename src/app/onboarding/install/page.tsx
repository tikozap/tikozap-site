// src/app/onboarding/install/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import OnboardingNav from '../_components/OnboardingNav';

type WidgetSettings = {
  publicKey: string;
  installedAt: string | null;
};

export default function InstallStep() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [allowedDomains, setAllowedDomains] = useState('localhost');
  const [publicKey, setPublicKey] = useState('');
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch('/api/widget/settings', { method: 'GET' });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || 'Failed to load widget settings');
        }

        if (!alive) return;

        const w = data.widget as WidgetSettings;
        setPublicKey(w?.publicKey || '');
        setInstalled(Boolean(w?.installedAt));
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

const snippet = useMemo(() => {
  const key = publicKey || 'YOUR_PUBLIC_KEY';
  return `<!-- TikoZap Widget -->
<script async
  src="https://js.tikozap.com/widget.js"
  data-tikozap-key="${key}">
</script>`;
}, [publicKey]);

  async function setInstalledOnServer(next: boolean) {
    if (saving) return;

    // optimistic UI
    const prev = installed;
    setInstalled(next);
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/widget/install', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ installed: next }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to save install status');
      }

      // sync from server (truth)
      setInstalled(Boolean(data?.widget?.installedAt));
    } catch (e: any) {
      setInstalled(prev);
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Install the widget</h2>
      <p className="mt-1 text-sm opacity-80">
        Copy this snippet into your store site (usually before <code>&lt;/body&gt;</code>).
      </p>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Allowed domains (security)</span>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="localhost, threetreefashion.com"
            value={allowedDomains}
            onChange={(e) => setAllowedDomains(e.target.value)}
            disabled={loading || saving}
          />
        </label>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm font-semibold">Install snippet</div>
          <pre className="mt-3 overflow-auto rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed">
{snippet}
          </pre>
          <div className="mt-2 text-xs opacity-70">
            (We’ll wire “allowed domains” into the real embed later. For now this is UI-only.)
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={installed}
            onChange={(e) => setInstalledOnServer(e.target.checked)}
            disabled={loading || saving}
          />
          {saving ? 'Saving…' : 'I installed the snippet (for testing, you can pretend)'}
        </label>
      </div>

      <OnboardingNav
        backHref="/onboarding/widget"
        nextHref="/onboarding/test"
        nextLabel="Next: Test it"
      />
    </div>
  );
}

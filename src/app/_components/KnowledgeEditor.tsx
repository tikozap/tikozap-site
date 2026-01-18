// src/app/_components/KnowledgeEditor.tsx
'use client';

import { useEffect, useState } from 'react';

type Doc = { title: string; content: string | null };

function byTitle(docs: Doc[], title: string) {
  const hit = docs.find((d) => (d.title || '').toLowerCase() === title.toLowerCase());
  return (hit?.content || '').toString();
}

export default function KnowledgeEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [returnsText, setReturnsText] = useState('');
  const [shippingText, setShippingText] = useState('');
  const [sizingText, setSizingText] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/knowledge', { method: 'GET' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to load knowledge');

      const docs: Doc[] = Array.isArray(data.docs) ? data.docs : [];
      setReturnsText(byTitle(docs, 'Returns'));
      setShippingText(byTitle(docs, 'Shipping'));
      setSizingText(byTitle(docs, 'Sizing'));
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          returns: returnsText,
          shipping: shippingText,
          sizing: sizingText,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to save');
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mt-6 grid gap-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <label className="grid gap-1">
        <span className="text-sm font-medium">Return policy</span>
        <textarea
          className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Example: Returns accepted within 30 days. Items must be unworn with tags..."
          value={returnsText}
          onChange={(e) => setReturnsText(e.target.value)}
          disabled={loading || saving}
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Shipping policy</span>
        <textarea
          className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Example: Orders ship in 1–2 business days. US delivery in 3–7 days..."
          value={shippingText}
          onChange={(e) => setShippingText(e.target.value)}
          disabled={loading || saving}
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Size guide</span>
        <textarea
          className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Example: Runs true to size. If between sizes, size up..."
          value={sizingText}
          onChange={(e) => setSizingText(e.target.value)}
          disabled={loading || saving}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={loading || saving}
          className="inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save knowledge'}
        </button>

        <button
          onClick={load}
          disabled={loading || saving}
          className="inline-flex rounded-xl border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60"
        >
          Reload
        </button>

        <div className="text-xs opacity-70">
          Saved as Knowledge Docs: Returns / Shipping / Sizing
        </div>
      </div>
    </div>
  );
}

// src/app/_components/KnowledgeEditor.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Doc = { title: string; content: string | null };

function byTitle(docs: Doc[], title: string) {
  const hit = docs.find((d) => (d.title || '').toLowerCase() === title.toLowerCase());
  return (hit?.content || '').toString();
}

type Mode = 'simple' | 'advanced';

const TEMPLATES = {
  storeInfo: `Store name:
Location:
Hours:
Phone:
Email:
Order/Support notes:
- If you need an order number or email to look up an order, ask for it.
- If something is unclear, ask ONE short follow-up question.`,

  brandVoice: `Tone: warm, professional, concise.
Answer length: usually 2–6 sentences, use bullets when helpful.
Rules:
- Do NOT invent policies, prices, or order status.
- If you don’t know, say what you need (order #, email, item name, etc).
- Hand off to human staff for edge cases or angry customers.`,

  returns: `Returns policy (example template — edit to match your store):
- Return window: 30 days from delivery
- Condition: unused/unworn, tags on, original packaging
- Refunds: processed 3–7 business days after inspection
- Exchanges: allowed (ask for item + size/color)
- How to start: ask for order number + email, then provide steps/label info`,

  shipping: `Shipping policy (example template — edit to match your store):
- Processing time: 1–2 business days
- US delivery: 3–7 business days
- International: varies by country
- Tracking: provided by email/SMS when shipped
- If delayed: ask for order # + email, then share latest tracking status`,

  sizing: `Sizing & fit notes (example template — edit to match your store):
- Runs: true to size (or runs small/large)
- Between sizes: recommend sizing up/down (choose one)
- Common fit notes: (add product-specific notes if you have them)
- If unsure: ask what they usually wear + height/weight (optional) + preferred fit`,

  otherNotes: `Other helpful notes (optional):
FAQs:
- Do you ship to PO boxes?
- Can I change/cancel an order?
- How do gift returns work?
Escalation rules:
- Fraud/chargeback → hand off to staff
- Medical/legal questions → politely decline, hand off if needed`,
};

export default function KnowledgeEditor() {
  const [mode, setMode] = useState<Mode>('simple');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  const [storeInfoText, setStoreInfoText] = useState('');
  const [brandVoiceText, setBrandVoiceText] = useState('');
  const [returnsText, setReturnsText] = useState('');
  const [shippingText, setShippingText] = useState('');
  const [sizingText, setSizingText] = useState('');
  const [otherNotesText, setOtherNotesText] = useState('');

  const disabled = loading || saving;

  const savePayload = useMemo(
    () => ({
      storeInfo: storeInfoText,
      brandVoice: brandVoiceText,
      returns: returnsText,
      shipping: shippingText,
      sizing: sizingText,
      otherNotes: otherNotesText,
    }),
    [storeInfoText, brandVoiceText, returnsText, shippingText, sizingText, otherNotesText],
  );

  async function load() {
    setLoading(true);
    setError('');
    setSavedOk(false);
    try {
      const res = await fetch('/api/knowledge', { method: 'GET' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to load knowledge');

      const docs: Doc[] = Array.isArray(data.docs) ? data.docs : [];

      setStoreInfoText(byTitle(docs, 'Store Info'));
      setBrandVoiceText(byTitle(docs, 'Brand Voice'));
      setReturnsText(byTitle(docs, 'Returns'));
      setShippingText(byTitle(docs, 'Shipping'));
      setSizingText(byTitle(docs, 'Sizing'));
      setOtherNotesText(byTitle(docs, 'Other Notes'));
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
    setSavedOk(false);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(savePayload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to save');

      setSavedOk(true);
      // refresh so updatedAt ordering is consistent in Dashboard → Knowledge
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function insertTemplate(
    setter: (v: string) => void,
    current: string,
    templateKey: keyof typeof TEMPLATES,
  ) {
    const t = TEMPLATES[templateKey];
    if (!current.trim()) setter(t);
    else setter(current.trimEnd() + '\n\n' + t);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mt-6 grid gap-4">
      {/* mode toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Mode:</span>

        <button
          type="button"
          onClick={() => setMode('simple')}
          className={`rounded-xl px-3 py-1.5 text-sm border ${
            mode === 'simple' ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-300 hover:bg-zinc-50'
          }`}
          disabled={disabled}
        >
          Simple
        </button>

        <button
          type="button"
          onClick={() => setMode('advanced')}
          className={`rounded-xl px-3 py-1.5 text-sm border ${
            mode === 'advanced' ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-300 hover:bg-zinc-50'
          }`}
          disabled={disabled}
        >
          Advanced
        </button>

        <span className="text-xs opacity-70">
          Simple mode = templates + guidance. Advanced = raw editing.
        </span>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {savedOk ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved ✅
        </div>
      ) : null}

      {/* SIMPLE MODE */}
      {mode === 'simple' ? (
        <div className="grid gap-4">
          {/* Store Info */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">Store Info</div>
                <div className="text-xs opacity-70">
                  Fast facts the assistant should know (hours, contact, location).
                </div>
              </div>

              <button
                type="button"
                onClick={() => insertTemplate(setStoreInfoText, storeInfoText, 'storeInfo')}
                disabled={disabled}
                className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-60"
              >
                Insert template
              </button>
            </div>

            <textarea
              className="mt-3 min-h-[120px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Add store basics here…"
              value={storeInfoText}
              onChange={(e) => setStoreInfoText(e.target.value)}
              disabled={disabled}
            />
          </div>

          {/* Brand Voice */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">Brand Voice</div>
                <div className="text-xs opacity-70">
                  Tone + rules (helps answers feel consistent and human).
                </div>
              </div>

              <button
                type="button"
                onClick={() => insertTemplate(setBrandVoiceText, brandVoiceText, 'brandVoice')}
                disabled={disabled}
                className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-60"
              >
                Insert template
              </button>
            </div>

            <textarea
              className="mt-3 min-h-[120px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Describe tone + do/don’t rules…"
              value={brandVoiceText}
              onChange={(e) => setBrandVoiceText(e.target.value)}
              disabled={disabled}
            />
          </div>

          {/* Returns / Shipping / Sizing */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">Returns</div>
                <button
                  type="button"
                  onClick={() => insertTemplate(setReturnsText, returnsText, 'returns')}
                  disabled={disabled}
                  className="rounded-xl border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 disabled:opacity-60"
                >
                  Template
                </button>
              </div>
              <textarea
                className="mt-3 min-h-[120px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Return window, condition, refund timing…"
                value={returnsText}
                onChange={(e) => setReturnsText(e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">Shipping</div>
                <button
                  type="button"
                  onClick={() => insertTemplate(setShippingText, shippingText, 'shipping')}
                  disabled={disabled}
                  className="rounded-xl border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 disabled:opacity-60"
                >
                  Template
                </button>
              </div>
              <textarea
                className="mt-3 min-h-[120px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Processing time, delivery estimates…"
                value={shippingText}
                onChange={(e) => setShippingText(e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">Sizing</div>
                <button
                  type="button"
                  onClick={() => insertTemplate(setSizingText, sizingText, 'sizing')}
                  disabled={disabled}
                  className="rounded-xl border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 disabled:opacity-60"
                >
                  Template
                </button>
              </div>
              <textarea
                className="mt-3 min-h-[120px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                placeholder="True to size? between sizes guidance…"
                value={sizingText}
                onChange={(e) => setSizingText(e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Other Notes */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">Other Notes (optional)</div>
                <div className="text-xs opacity-70">
                  FAQs, escalation rules, special cases.
                </div>
              </div>

              <button
                type="button"
                onClick={() => insertTemplate(setOtherNotesText, otherNotesText, 'otherNotes')}
                disabled={disabled}
                className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-60"
              >
                Insert template
              </button>
            </div>

            <textarea
              className="mt-3 min-h-[120px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Optional FAQs and escalation rules…"
              value={otherNotesText}
              onChange={(e) => setOtherNotesText(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      ) : null}

      {/* ADVANCED MODE (raw editing) */}
      {mode === 'advanced' ? (
        <div className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Store Info</span>
            <textarea
              className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              value={storeInfoText}
              onChange={(e) => setStoreInfoText(e.target.value)}
              disabled={disabled}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Brand Voice</span>
            <textarea
              className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              value={brandVoiceText}
              onChange={(e) => setBrandVoiceText(e.target.value)}
              disabled={disabled}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Return policy</span>
            <textarea
              className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              value={returnsText}
              onChange={(e) => setReturnsText(e.target.value)}
              disabled={disabled}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Shipping policy</span>
            <textarea
              className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              value={shippingText}
              onChange={(e) => setShippingText(e.target.value)}
              disabled={disabled}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Size guide</span>
            <textarea
              className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              value={sizingText}
              onChange={(e) => setSizingText(e.target.value)}
              disabled={disabled}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Other Notes</span>
            <textarea
              className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              value={otherNotesText}
              onChange={(e) => setOtherNotesText(e.target.value)}
              disabled={disabled}
            />
          </label>
        </div>
      ) : null}

      {/* actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={disabled}
          className="inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save knowledge'}
        </button>

        <button
          type="button"
          onClick={load}
          disabled={disabled}
          className="inline-flex rounded-xl border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60"
        >
          Reload
        </button>

        <div className="text-xs opacity-70">
          Saves as Knowledge Docs: Store Info / Brand Voice / Returns / Shipping / Sizing / Other Notes
        </div>
      </div>
    </div>
  );
}

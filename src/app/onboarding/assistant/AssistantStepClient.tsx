// src/app/onboarding/assistant/AssistantStepClient.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Props = {
  initialAssistantName: string;
  initialGreeting: string;
  initialStoreInfo: string;
};

export default function AssistantStepClient({
  initialAssistantName,
  initialGreeting,
  initialStoreInfo,
}: Props) {
  const router = useRouter();

  const [assistantName, setAssistantName] = useState(initialAssistantName);
  const [greeting, setGreeting] = useState(initialGreeting);
  const [storeInfo, setStoreInfo] = useState(initialStoreInfo);
  const [saving, setSaving] = useState(false);

  async function saveAndNext() {
    setSaving(true);

    const res = await fetch('/api/onboarding/assistant', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        assistantName,
        greeting,
        storeInfo,
      }),
    });

    const data = await res.json().catch(() => null);

    setSaving(false);

    if (!res.ok || !data?.ok) {
      alert(data?.error || 'Could not save assistant setup.');
      return;
    }

    router.push('/onboarding/install');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Define your AI store assistant
        </h2>

        <p className="text-sm leading-6 opacity-80">
          Set the assistant name, edit greeting, and add a few store details. You can refine everything later.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Assistant name</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                placeholder="Name your assistant"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Greeting message</span>
              <textarea
                className="min-h-[110px] w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Hi! I’m here to help with products, orders, shipping, and returns."
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <div className="text-sm font-semibold">
              Store information (optional)
            </div>

            <p className="mt-1 text-xs leading-5 opacity-75">
              Paste a few important details about your store. You can add more knowledge later.
            </p>
          </div>

          <textarea
            className="min-h-[180px] w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
            value={storeInfo}
            onChange={(e) => setStoreInfo(e.target.value)}
            placeholder={`Returns accepted within 30 days.

Orders ship in 1–2 business days.

US delivery in 3–7 business days.`}
          />
        </div>
      </div>

      <div className="ob-actions">
        <Link href="/onboarding/store" className="ob-btn">
          Back
        </Link>

        <button
          type="button"
          className="ob-btn primary"
          onClick={saveAndNext}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Next: Launch'}
        </button>
      </div>
    </div>
  );
}
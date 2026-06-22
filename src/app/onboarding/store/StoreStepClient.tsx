// src/app/onboarding/store/StoreStepClient.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Props = {
  initialStoreName: string;
  initialWebsiteUrl: string;
  initialSupportEmail: string;
  initialCategory: string;
};

export default function StoreStepClient({
  initialStoreName,
  initialWebsiteUrl,
  initialSupportEmail,
  initialCategory,
}: Props) {
  const router = useRouter();
  const [storeName, setStoreName] = useState(initialStoreName);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl);
  const [supportEmail, setSupportEmail] = useState(initialSupportEmail);
  const [category, setCategory] = useState(initialCategory || 'Fashion');
  const [saving, setSaving] = useState(false);

  async function saveAndNext() {
    setSaving(true);

    const res = await fetch('/api/onboarding/store', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        storeName,
        websiteUrl,
        supportEmail,
        category,
      }),
    });

    const data = await res.json().catch(() => null);

    setSaving(false);

    if (!res.ok || !data?.ok) {
      alert(data?.error || 'Could not save store basics.');
      return;
    }

    router.push('/onboarding/assistant');
    router.refresh();
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Store basics</h2>
      <p className="mt-1 text-sm opacity-80">
        Tell us a little about your store so we can set up your workspace.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Store name</span>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Your Store"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Store website (optional)</span>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="https://yourstore.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Support email</span>
            <input
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              placeholder="support@yourstore.com"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Primary category</span>
            <select
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Fashion</option>
              <option>Beauty</option>
              <option>Electronics</option>
              <option>Home & living</option>
              <option>Food & beverage</option>
              <option>Jewelry & accessories</option>
              <option>Sports & outdoors</option>
              <option>Health & wellness</option>
              <option>Pet supplies</option>
              <option>Flowers & gifts</option>
              <option>Books & stationery</option>
              <option>Other</option>
            </select>
          </label>
        </div>
      </div>

      <div className="ob-actions">
        <span />
        <button
          type="button"
          className="ob-btn primary"
          onClick={saveAndNext}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Next'}
        </button>
      </div>
    </div>
  );
}
// src/app/onboarding/install/page.tsx

'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import OnboardingNav from '../_components/OnboardingNav';

type PathMode = 'website' | 'starter-link';

function toSlug(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function InstallStep() {
  return (
    <Suspense fallback={null}>
      <InstallStepInner />
    </Suspense>
  );
}

function InstallStepInner() {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode');

  const pathMode: PathMode = urlMode === 'starter-link' ? 'starter-link' : 'website';

  const [origin, setOrigin] = useState('');
  const [storeSlug, setStoreSlug] = useState('my-store');
  const [starterEnabled, setStarterEnabled] = useState(true);
  const [publicKey, setPublicKey] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [confirmedInstall, setConfirmedInstall] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [saveTone, setSaveTone] = useState<'ok' | 'err'>('ok');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWidgetSettings() {
      try {
        const res = await fetch('/api/widget/settings', { cache: 'no-store' });
        const data = await res.json().catch(() => null);

        const key =
          data?.widget?.publicKey ||
          data?.settings?.publicKey ||
          data?.publicKey ||
          '';

        if (!cancelled && key) {
          setPublicKey(String(key));
        }
      } catch {}
    }

    void loadWidgetSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (pathMode !== 'starter-link') return;

    let cancelled = false;

    async function loadStarterLink() {
      try {
        const res = await fetch('/api/starter-link', { cache: 'no-store' });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.starterLink) return;

        const nextSlug = toSlug(String(data.starterLink.slug || 'my-store')) || 'my-store';
        const nextEnabled = data.starterLink.enabled === false ? false : true;

        if (!cancelled) {
          setStoreSlug(nextSlug);
          setStarterEnabled(nextEnabled);
        }
      } catch {}
    }

    void loadStarterLink();

    return () => {
      cancelled = true;
    };
  }, [pathMode]);

  useEffect(() => {
    if (!copyMsg) return;
    const timer = window.setTimeout(() => setCopyMsg(''), 2400);
    return () => window.clearTimeout(timer);
  }, [copyMsg]);

  useEffect(() => {
    if (!saveMsg) return;
    const timer = window.setTimeout(() => setSaveMsg(''), 2600);
    return () => window.clearTimeout(timer);
  }, [saveMsg]);

  const widgetSnippet = useMemo(() => {
    const src = origin ? `${origin}/widget.js` : 'https://js.tikozap.com/widget.js';
    const key = publicKey || 'tz_your_public_key';

    return `<script
  src="${src}"
  data-tikozap-key="${key}"
></script>`;
  }, [origin, publicKey]);

  const developerInstructions = useMemo(() => {
    return `Please add this TikoZap chat assistant script to our website before the closing </body> tag:

${widgetSnippet}

After adding it, open the website and confirm the TikoZap chat bubble appears.`;
  }, [widgetSnippet]);

  const starterLink = useMemo(() => {
    const slug = toSlug(storeSlug) || 'my-store';
    return `${origin || 'https://tikozap.com'}/l/${slug}`;
  }, [origin, storeSlug]);

  const bioTemplate = useMemo(
    () =>
      `Need support with your order? Message us here: ${starterLink}\n` +
      `Fast help for shipping, returns, order status, and sizing.`,
    [starterLink],
  );

  const marketplaceDmTemplate = useMemo(
    () =>
      `Hi! Thanks for your message. For fastest support, please contact us here: ${starterLink}\n` +
      `Our assistant can help instantly with shipping, returns, order updates, and sizing.`,
    [starterLink],
  );

  const qrImageUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
        starterLink,
      )}`,
    [starterLink],
  );

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(`${label} copied.`);
    } catch {
      setCopyMsg(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  const saveStarterLink = async () => {
    if (saving) return;

    setSaving(true);
    setSaveMsg('');

    try {
      const cleanSlug = toSlug(storeSlug) || 'my-store';

      const res = await fetch('/api/starter-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug: cleanSlug,
          enabled: starterEnabled,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok || !data?.starterLink?.slug) {
        throw new Error(data?.error || 'Could not save Starter Link.');
      }

      setStoreSlug(toSlug(String(data.starterLink.slug)) || cleanSlug);
      setStarterEnabled(data.starterLink.enabled === false ? false : true);
      setSaveTone('ok');
      setSaveMsg('Starter Link saved.');
    } catch (err: any) {
      setSaveTone('err');
      setSaveMsg(err?.message || 'Could not save Starter Link.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold tracking-tight">
          {pathMode === 'website'
            ? 'Install TikoZap on your website'
            : 'Create your Starter Link'}
        </h2>

        <p className="text-sm leading-6 opacity-80">
          {pathMode === 'website'
            ? 'Add your AI assistant to your store, then send a test message.'
            : 'Create a hosted support page you can share in your bio, marketplace listings, or messages.'}
        </p>
      </div>

      {pathMode === 'website' ? (
        <div className="space-y-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold">Add TikoZap to your website</div>

            <p className="mt-1 text-xs leading-5 opacity-75">
              Copy this one-line script and add it to your website. If someone else manages your
              site, copy the developer instructions instead.
            </p>

            <label className="mt-4 grid gap-1.5">
              <span className="text-sm font-medium">Website URL</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
                placeholder="https://yourstore.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </label>

            <pre className="mt-4 overflow-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed">
              {widgetSnippet}
            </pre>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                onClick={() => copy(widgetSnippet, 'Widget script')}
              >
                Copy script
              </button>

              <button
                type="button"
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
                onClick={() => copy(developerInstructions, 'Developer instructions')}
              >
                Copy developer instructions
              </button>
            </div>

            {!publicKey ? (
              <p className="mt-3 text-xs text-amber-700">
                Widget key is still loading. If the copied script says tz_your_public_key, wait a
                moment and refresh this page.
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="text-sm font-semibold">What to do next</div>

            <div className="mt-3 grid gap-3 text-sm text-zinc-700">
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                1. Add the TikoZap script to your website
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                2. Open your website and look for the chat bubble
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                3. Send a test message, then check your Inbox
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold">Your Starter Link</div>

            <p className="mt-1 text-xs leading-5 opacity-75">
              Use this link if you do not have a website yet. Customers can open it and message your
              AI assistant directly.
            </p>

            <label className="mt-4 grid gap-1.5">
              <span className="text-sm font-medium">Choose your link</span>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="min-w-[240px] flex-1 rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(toSlug(e.target.value))}
                  placeholder="your-store"
                />

                <button
                  type="button"
                  className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800"
                  onClick={saveStarterLink}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </label>

            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={starterEnabled}
                onChange={(e) => setStarterEnabled(e.target.checked)}
              />
              Starter Link enabled
            </label>

            <pre className="mt-4 overflow-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed">
              {starterLink}
            </pre>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                onClick={() => copy(starterLink, 'Starter Link')}
              >
                Copy Starter Link
              </button>

              <a
                href={starterLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
              >
                Open Link
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="text-sm font-semibold">Share templates</div>

            <p className="mt-1 text-xs leading-5 opacity-75">
              Copy-ready text for your social bio, marketplace replies, and QR sharing.
            </p>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide opacity-60">
                  Bio template
                </div>

                <pre className="mt-2 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed">
                  {bioTemplate}
                </pre>

                <button
                  type="button"
                  className="mt-3 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
                  onClick={() => copy(bioTemplate, 'Bio template')}
                >
                  Copy bio template
                </button>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide opacity-60">
                  Marketplace message
                </div>

                <pre className="mt-2 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed">
                  {marketplaceDmTemplate}
                </pre>

                <button
                  type="button"
                  className="mt-3 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
                  onClick={() => copy(marketplaceDmTemplate, 'Marketplace message')}
                >
                  Copy marketplace message
                </button>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide opacity-60">
                  QR code
                </div>

                <p className="mt-2 text-xs leading-5 opacity-75">
                  Open this QR image and save it for flyers, packaging inserts, or posters.
                </p>

                <a
                  href={qrImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
                >
                  Open QR image
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {copyMsg ? (
        <p className="text-sm" style={{ color: '#065f46' }}>
          {copyMsg}
        </p>
      ) : null}

      {saveMsg ? (
        <p className="text-sm" style={{ color: saveTone === 'ok' ? '#065f46' : '#b91c1c' }}>
          {saveMsg}
        </p>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={confirmedInstall}
          onChange={(e) => setConfirmedInstall(e.target.checked)}
        />
        I completed this step and I’m ready to test
      </label>

      <OnboardingNav
        backHref="/onboarding/assistant"
        nextHref="/onboarding/test"
        nextLabel="Next: Test it"
      />
    </div>
  );
}
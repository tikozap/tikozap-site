'use client';

import { useEffect, useMemo, useState } from 'react';
import OnboardingNav from '../_components/OnboardingNav';

const DEFAULT_SLUG = 'demo-boutique';

type ActivationChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

type ActivationStatus = {
  trackedEvents: string[];
  checklist: ActivationChecklistItem[];
  completedCount: number;
  totalCount: number;
  completionPct: number;
  isComplete: boolean;
};

const EMPTY_ACTIVATION_STATUS: ActivationStatus = {
  trackedEvents: [],
  checklist: [
    { id: 'save_starter_link', label: 'Save Starter Link settings', done: false },
    {
      id: 'copy_share_template',
      label: 'Copy Starter Link or a channel template',
      done: false,
    },
    { id: 'open_starter_link', label: 'Open your Starter Link preview', done: false },
    {
      id: 'confirm_install_or_share',
      label: 'Confirm install/share is complete',
      done: false,
    },
    {
      id: 'send_test_message',
      label: 'Send first test message in onboarding',
      done: false,
    },
  ],
  completedCount: 0,
  totalCount: 5,
  completionPct: 0,
  isComplete: false,
};

const ACTIVATION_EVENTS = {
  savedStarterLink: 'activation_saved_starter_link',
  copiedStarterLink: 'activation_copied_starter_link',
  copiedBioTemplate: 'activation_copied_bio_template',
  copiedMarketplaceDmTemplate: 'activation_copied_marketplace_dm_template',
  openedQrTemplate: 'activation_opened_qr_template',
  openedStarterLink: 'activation_opened_starter_link',
  confirmedInstallOrShare: 'activation_confirmed_install_or_share',
} as const;

function toSlug(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function InstallStep() {
  const [detectedSlug, setDetectedSlug] = useState(DEFAULT_SLUG);
  const [tenantSlug, setTenantSlug] = useState(DEFAULT_SLUG);
  const [allowedDomains, setAllowedDomains] = useState('localhost');
  const [starterEnabled, setStarterEnabled] = useState(true);
  const [confirmedInstall, setConfirmedInstall] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [saveTone, setSaveTone] = useState<'ok' | 'err'>('ok');
  const [activation, setActivation] = useState<ActivationStatus>(EMPTY_ACTIVATION_STATUS);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let nextSlug = DEFAULT_SLUG;
      let nextEnabled = true;

      try {
        const res = await fetch('/api/starter-link', { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.starterLink?.slug) {
          nextSlug = toSlug(String(data.starterLink.slug)) || nextSlug;
          nextEnabled = data?.starterLink?.enabled === false ? false : true;
        }
      } catch {}

      if (typeof window !== 'undefined') {
        const localSlug = window.localStorage.getItem('tz_demo_tenant_slug');
        if (localSlug) nextSlug = toSlug(localSlug) || nextSlug;

        const host = window.location.hostname || '';
        if (host && host !== 'localhost') {
          setAllowedDomains((prev) => (prev.includes(host) ? prev : `${prev}, ${host}`));
        }
      }

      if (!cancelled) {
        setDetectedSlug(nextSlug);
        setTenantSlug(nextSlug);
        setStarterEnabled(nextEnabled);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/onboarding/activation', { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok || !data?.status) return;

        if (!cancelled) {
          const status = data.status as ActivationStatus;
          setActivation(status);
          const confirmStep = status.checklist.find(
            (item) => item.id === 'confirm_install_or_share',
          );
          if (confirmStep?.done) setConfirmedInstall(true);
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const trackActivation = async (event: string) => {
    try {
      const res = await fetch('/api/onboarding/activation', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data?.status) {
        setActivation(data.status as ActivationStatus);
      }
    } catch {}
  };

  const snippet = useMemo(
    () => `<script>
  window.TIKOZAP_TENANT = "${tenantSlug}";
</script>
<script async src="https://cdn.tikozap.com/widget.js"></script>`,
    [tenantSlug],
  );

  const starterLink = useMemo(
    () => `https://app.tikozap.com/s/${tenantSlug || DEFAULT_SLUG}`,
    [tenantSlug],
  );

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

  const qrCaptionTemplate = useMemo(
    () => `Scan for instant support: ${starterLink}`,
    [starterLink],
  );

  const qrImageUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
        starterLink,
      )}`,
    [starterLink],
  );

  const copy = async (text: string, label: string, activationEvent?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(`${label} copied.`);
      if (activationEvent) void trackActivation(activationEvent);
    } catch {
      setCopyMsg(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  const saveStarterLink = async () => {
    if (saving) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/starter-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: tenantSlug, enabled: starterEnabled }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data?.starterLink?.slug) {
        throw new Error(data?.error || 'Could not save Starter Link settings.');
      }
      const persistedSlug = toSlug(data.starterLink.slug) || tenantSlug;
      setDetectedSlug(persistedSlug);
      setTenantSlug(persistedSlug);
      setStarterEnabled(data.starterLink.enabled === false ? false : true);
      setSaveTone('ok');
      setSaveMsg('Starter Link settings saved.');
      void trackActivation(ACTIVATION_EVENTS.savedStarterLink);
    } catch (err: any) {
      setSaveTone('err');
      setSaveMsg(err?.message || 'Could not save Starter Link settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold">Install widget or share Starter Link</h2>
      <p className="mt-1 text-sm opacity-80">
        Use the widget snippet for websites, or share Starter Link if you do not have a
        site yet.
      </p>

      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">First-value checklist</div>
              <p className="mt-1 text-xs opacity-80">
                Complete these onboarding steps to reach first customer value quickly.
              </p>
            </div>
            <div className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium">
              {activation.completedCount}/{activation.totalCount}
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-zinc-900 transition-all"
              style={{ width: `${activation.completionPct}%` }}
            />
          </div>
          <ul className="mt-3 grid gap-2">
            {activation.checklist.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                <span
                  className={[
                    'mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[11px]',
                    item.done ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-600',
                  ].join(' ')}
                >
                  {item.done ? '✓' : '•'}
                </span>
                <span className={item.done ? 'text-zinc-900' : 'text-zinc-600'}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Allowed domains (security)</span>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="localhost, threetreefashion.com"
            value={allowedDomains}
            onChange={(e) => setAllowedDomains(e.target.value)}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Starter Link slug</span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="min-w-[240px] flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(toSlug(e.target.value))}
              placeholder="your-store-slug"
            />
            <button
              type="button"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={() => setTenantSlug(detectedSlug)}
            >
              Use detected slug
            </button>
            <button
              type="button"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={saveStarterLink}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Starter Link'}
            </button>
          </div>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={starterEnabled}
            onChange={(e) => setStarterEnabled(e.target.checked)}
          />
          Starter Link enabled
        </label>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm font-semibold">Website widget snippet</div>
          <pre className="mt-3 overflow-auto rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed">
{snippet}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={() => copy(snippet, 'Widget snippet')}
            >
              Copy snippet
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm font-semibold">Starter Link (no website)</div>
          <p className="mt-1 text-xs opacity-80">
            Share this URL in your bio, social profiles, marketplace messages, or QR code.
          </p>
          {!starterEnabled ? (
            <p className="mt-2 text-xs" style={{ color: '#9a3412' }}>
              Starter Link is currently disabled. Enable and save to activate sharing.
            </p>
          ) : null}
          <pre className="mt-3 overflow-auto rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed">
{starterLink}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={() =>
                copy(
                  starterLink,
                  'Starter Link',
                  ACTIVATION_EVENTS.copiedStarterLink,
                )
              }
            >
              Copy Starter Link
            </button>
            <a
              href={starterLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={() => {
                void trackActivation(ACTIVATION_EVENTS.openedStarterLink);
              }}
            >
              Open Link
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm font-semibold">Starter Link channel presets</div>
          <p className="mt-1 text-xs opacity-80">
            Copy-ready templates for bio links, marketplace DMs, and QR sharing.
          </p>

          <div className="mt-3 grid gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-3">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Bio template (Instagram/TikTok/Link-in-bio)
              </div>
              <pre className="mt-2 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs leading-relaxed">
{bioTemplate}
              </pre>
              <button
                type="button"
                className="mt-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                onClick={() =>
                  copy(
                    bioTemplate,
                    'Bio template',
                    ACTIVATION_EVENTS.copiedBioTemplate,
                  )
                }
              >
                Copy bio template
              </button>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-3">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Marketplace DM template
              </div>
              <pre className="mt-2 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs leading-relaxed">
{marketplaceDmTemplate}
              </pre>
              <button
                type="button"
                className="mt-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                onClick={() =>
                  copy(
                    marketplaceDmTemplate,
                    'Marketplace DM template',
                    ACTIVATION_EVENTS.copiedMarketplaceDmTemplate,
                  )
                }
              >
                Copy marketplace DM
              </button>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-3">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                QR sharing preset
              </div>
              <pre className="mt-2 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs leading-relaxed">
{qrCaptionTemplate}
              </pre>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={qrImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                  onClick={() => {
                    void trackActivation(ACTIVATION_EVENTS.openedQrTemplate);
                  }}
                >
                  Open QR image
                </a>
                <button
                  type="button"
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                  onClick={() =>
                    copy(
                      qrCaptionTemplate,
                      'QR caption',
                      ACTIVATION_EVENTS.openedQrTemplate,
                    )
                  }
                >
                  Copy QR caption
                </button>
              </div>
            </div>
          </div>
        </div>

        {copyMsg ? <p className="text-sm" style={{ color: '#065f46' }}>{copyMsg}</p> : null}
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
            onChange={(e) => {
              const checked = e.target.checked;
              setConfirmedInstall(checked);
              if (checked) {
                void trackActivation(ACTIVATION_EVENTS.confirmedInstallOrShare);
              }
            }}
          />{' '}
          I installed the widget or shared my Starter Link (for testing, you can pretend)
        </label>
      </div>

      <OnboardingNav backHref="/onboarding/widget" nextHref="/onboarding/test" nextLabel="Next: Test it" />
    </div>
  );
}

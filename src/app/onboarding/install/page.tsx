'use client';

import { useEffect, useMemo, useState } from 'react';
import OnboardingNav from '../_components/OnboardingNav';

const DEFAULT_SLUG = 'three-tree-fashion';

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
  const [copyMsg, setCopyMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let nextSlug = DEFAULT_SLUG;

      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.tenant?.slug) {
          nextSlug = toSlug(String(data.tenant.slug)) || nextSlug;
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

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(`${label} copied.`);
    } catch {
      setCopyMsg(`Could not copy ${label.toLowerCase()}.`);
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
          </div>
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
          <pre className="mt-3 overflow-auto rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed">
{starterLink}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              onClick={() => copy(starterLink, 'Starter Link')}
            >
              Copy Starter Link
            </button>
            <a
              href={starterLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
            >
              Open Link
            </a>
          </div>
        </div>

        {copyMsg ? <p className="text-sm" style={{ color: '#065f46' }}>{copyMsg}</p> : null}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" /> I installed the widget or shared my Starter Link (for testing, you can pretend)
        </label>
      </div>

      <OnboardingNav backHref="/onboarding/widget" nextHref="/onboarding/test" nextLabel="Next: Test it" />
    </div>
  );
}

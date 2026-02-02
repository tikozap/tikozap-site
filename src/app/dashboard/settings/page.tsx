// src/app/dashboard/settings/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type WidgetSettings = {
  publicKey: string;
  enabled: boolean;
  assistantName: string | null;
  greeting: string | null;
  brandColor: string | null;
  allowedDomains: string[];
  installedAt: string | null;
};

function normalizeDomain(input: string) {
  const raw = (input || '').trim().toLowerCase();
  if (!raw) return '';

  // allow wildcard rules like "*.example.com"
  if (raw.startsWith('*.')) return raw;

  // if user pasted a URL, try to extract hostname
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const u = new URL(raw);
      return u.hostname.replace(/^www\./, '');
    }
  } catch {}

  // plain hostname
  return raw.replace(/^www\./, '');
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingWidget, setSavingWidget] = useState(false);
  const [savingTz, setSavingTz] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [widget, setWidget] = useState<WidgetSettings | null>(null);
  const [timeZone, setTimeZone] = useState('America/New_York');

  // Editable fields
  const [assistantName, setAssistantName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [brandColor, setBrandColor] = useState('#111827');
  const [enabled, setEnabled] = useState(true);
  const [allowedDomainsText, setAllowedDomainsText] = useState('');

  const allowedDomainsParsed = useMemo(() => {
    const lines = allowedDomainsText
      .split('\n')
      .map((l) => normalizeDomain(l))
      .filter(Boolean);

    return uniq(lines);
  }, [allowedDomainsText]);

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const [wRes, tzRes] = await Promise.all([
        fetch('/api/widget/settings', { method: 'GET' }),
        fetch('/api/settings/timezone', { method: 'GET' }),
      ]);

      const wJson = await wRes.json();
      const tzJson = await tzRes.json();

      if (!wRes.ok || !wJson?.ok) throw new Error(wJson?.error || 'Failed to load widget settings');
      if (tzRes.ok && tzJson?.ok && tzJson?.timeZone) {
        setTimeZone(String(tzJson.timeZone));
      }

      const w: WidgetSettings = wJson.widget;
      setWidget(w);

      setAssistantName(w.assistantName || '');
      setGreeting(w.greeting || '');
      setBrandColor(w.brandColor || '#111827');
      setEnabled(Boolean(w.enabled));

      const domains = Array.isArray(w.allowedDomains) ? w.allowedDomains : [];
      setAllowedDomainsText(domains.join('\n'));
    } catch (e: any) {
      setError(e?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function saveWidget() {
    setSavingWidget(true);
    setError(null);
    try {
      const res = await fetch('/api/widget/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          assistantName: assistantName.trim() || null,
          greeting: greeting.trim() || null,
          brandColor: brandColor.trim() || null,
          enabled,
          allowedDomains: allowedDomainsParsed,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to save widget settings');

      setWidget(json.widget);
    } catch (e: any) {
      setError(e?.message || 'Failed to save widget settings');
    } finally {
      setSavingWidget(false);
    }
  }

  async function saveTimeZone() {
    setSavingTz(true);
    setError(null);
    try {
      const tz = (timeZone || '').trim() || 'America/New_York';

      const res = await fetch('/api/settings/timezone', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ timeZone: tz }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to save timezone');

      setTimeZone(String(json.timeZone || tz));
    } catch (e: any) {
      setError(e?.message || 'Failed to save timezone');
    } finally {
      setSavingTz(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="db-title">Settings</h1>
        <p className="db-sub">Workspace, widget, domains, timezone.</p>
        <div style={{ marginTop: 14, opacity: 0.8 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="db-title">Settings</h1>
      <p className="db-sub">Workspace, widget, domains, timezone.</p>

      {error ? (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: '1px solid #fecaca', background: '#fff1f2' }}>
          <div style={{ fontWeight: 800 }}>Something went wrong</div>
          <div style={{ marginTop: 6 }}>{error}</div>
        </div>
      ) : null}

      <div style={{ marginTop: 14, border: '1px solid #e5e7eb', borderRadius: 16, padding: 14, background: '#fff' }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Widget</div>

        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Public key</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
              <code style={{ padding: '6px 10px', borderRadius: 10, background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                {widget?.publicKey || '(missing)'}
              </code>
              <button
                type="button"
                onClick={() => widget?.publicKey && navigator.clipboard.writeText(widget.publicKey)}
                style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 700 }}
              >
                Copy
              </button>
            </div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
              Use this in Shopify theme embed settings (public_key).
            </div>
          </div>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Assistant name</span>
            <input
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              placeholder="e.g., TikoZap Assistant"
              style={{ padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Greeting</span>
            <input
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="e.g., Hi! How can I help today?"
              style={{ padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Brand color</span>
            <input
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              placeholder="#111827"
              style={{ padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }}
            />
          </label>

          <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span style={{ fontWeight: 700 }}>Widget enabled</span>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Allowed domains</span>
            <textarea
              value={allowedDomainsText}
              onChange={(e) => setAllowedDomainsText(e.target.value)}
              rows={6}
              placeholder={`example.com\n*.example.com\nmy-store.myshopify.com`}
              style={{ padding: 10, borderRadius: 12, border: '1px solid #e5e7eb', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
            />
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              One per line. Supports wildcards like <code>*.example.com</code>. If this list is empty, no domain restriction is applied.
            </div>
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={saveWidget}
              disabled={savingWidget}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid #111827',
                background: '#111827',
                color: '#fff',
                fontWeight: 800,
                opacity: savingWidget ? 0.6 : 1,
              }}
            >
              {savingWidget ? 'Saving…' : 'Save widget settings'}
            </button>

            <button
              type="button"
              onClick={loadAll}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 800 }}
            >
              Reload
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, border: '1px solid #e5e7eb', borderRadius: 16, padding: 14, background: '#fff' }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Timezone</div>

        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>IANA timezone</span>
            <input
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              placeholder="America/New_York"
              style={{ padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }}
            />
            <div style={{ fontSize: 13, opacity: 0.75 }}>Example: America/New_York, America/Los_Angeles, Europe/London</div>
          </label>

          <button
            type="button"
            onClick={saveTimeZone}
            disabled={savingTz}
            style={{
              width: 'fit-content',
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: '#fff',
              fontWeight: 800,
              opacity: savingTz ? 0.6 : 1,
            }}
          >
            {savingTz ? 'Saving…' : 'Save timezone'}
          </button>
        </div>
      </div>
    </div>
  );
}

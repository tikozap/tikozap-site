// src/app/dashboard/link/_components/StarterLinkEditor.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Btn = { label: string; url: string };

type StarterLink = {
  id: string;
  tenantId: string;
  slug: string;
  published: boolean;
  title: string | null;
  tagline: string | null;
  greeting: string | null;
  buttonsJson: string | null;

  // optional storefront fields (supported by your API)
  logoUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
};

type ApiResp = {
  ok: boolean;
  link?: StarterLink;
  url?: string;
  error?: string;
};

const LINK_BASE = process.env.NEXT_PUBLIC_LINK_BASE || 'https://link.tikozap.com';

function parseButtons(json: string | null | undefined): Btn[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.label === 'string' && typeof x.url === 'string')
      .map((x) => ({ label: String(x.label).slice(0, 40), url: String(x.url).slice(0, 500) }))
      .slice(0, 6);
  } catch {
    return [];
  }
}

function normalizeButtons(input: Btn[]): Btn[] {
  const out: Btn[] = [];
  for (const b of input || []) {
    const label = String(b?.label || '').trim().slice(0, 40);
    const url = String(b?.url || '').trim().slice(0, 500);
    if (!label && !url) continue;
    if (!label || !url) continue;
    out.push({ label, url });
    if (out.length >= 6) break;
  }
  return out;
}

export default function StarterLinkEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const [link, setLink] = useState<StarterLink | null>(null);
  const [serverUrl, setServerUrl] = useState('');

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [greeting, setGreeting] = useState('');
  const [buttons, setButtons] = useState<Btn[]>([]);
  const [published, setPublished] = useState(false);

  // storefront fields
  const [logoUrl, setLogoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const publicUrl = useMemo(() => {
    if (serverUrl) return serverUrl;
    if (!link?.slug) return '';
    return `${LINK_BASE}/l/${encodeURIComponent(link.slug)}`;
  }, [serverUrl, link?.slug]);

  const qrSrc = useMemo(() => {
    if (!publicUrl) return '';
    // cache-bust so it updates immediately if slug changes in future
    return `/api/starter-link/qr?size=220&v=${encodeURIComponent(publicUrl)}`;
  }, [publicUrl]);

  useEffect(() => {
    (async () => {
      try {
        setErr('');
        const res = await fetch('/api/starter-link', { cache: 'no-store' });
        const data = (await res.json().catch(() => ({}))) as ApiResp;

        if (!res.ok || !data?.ok || !data.link) {
          throw new Error(data?.error || `Failed to load (${res.status})`);
        }

        setLink(data.link);
        setServerUrl(data.url || '');

        setTitle(data.link.title ?? '');
        setTagline(data.link.tagline ?? '');
        setGreeting(data.link.greeting ?? '');
        setButtons(parseButtons(data.link.buttonsJson));
        setPublished(Boolean(data.link.published));

        setLogoUrl(String(data.link.logoUrl ?? ''));
        setPhone(String(data.link.phone ?? ''));
        setAddress(String(data.link.address ?? ''));
        setCity(String(data.link.city ?? ''));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(nextPublished?: boolean) {
    setSaving(true);
    setErr('');
    try {
      const cleanedButtons = normalizeButtons(buttons);

      const res = await fetch('/api/starter-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || null,
          tagline: tagline.trim() || null,
          greeting: greeting.trim() || null,
          buttons: cleanedButtons,
          published: typeof nextPublished === 'boolean' ? nextPublished : published,

          // storefront fields
          logoUrl: logoUrl.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as ApiResp;

      if (!res.ok || !data?.ok || !data.link) {
        throw new Error(data?.error || `Save failed (${res.status})`);
      }

      setLink(data.link);
      setServerUrl(data.url || '');
      setPublished(Boolean(data.link.published));
      setButtons(parseButtons(data.link.buttonsJson));

      setLogoUrl(String(data.link.logoUrl ?? ''));
      setPhone(String(data.link.phone ?? ''));
      setAddress(String(data.link.address ?? ''));
      setCity(String(data.link.city ?? ''));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    window.alert('Link copied!');
  }

  function openLink() {
    if (!publicUrl) return;
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  }

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 16 }}>
      <h1 style={{ margin: 0 }}>TikoZap Link</h1>
      <p style={{ marginTop: 6, opacity: 0.75 }}>
        <span style={{ padding: '2px 10px', border: '1px solid #e5e7eb', borderRadius: 999 }}>
          No Website Needed
        </span>
      </p>

      {err && (
        <div style={{ marginTop: 10, padding: 12, border: '1px solid #fecaca', background: '#fff1f2', borderRadius: 14 }}>
          <b style={{ display: 'block', marginBottom: 6 }}>Error</b>
          <div style={{ fontSize: 13 }}>{err}</div>
        </div>
      )}

      <div style={{ marginTop: 14, padding: 12, border: '1px solid #e5e7eb', borderRadius: 14 }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Your link</div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
          <code style={{ flex: 1, minWidth: 240, padding: 10, border: '1px solid #e5e7eb', borderRadius: 12 }}>
            {publicUrl || '(not ready)'}
          </code>

          <button
            onClick={copyLink}
            disabled={!publicUrl}
            style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb', opacity: publicUrl ? 1 : 0.6 }}
          >
            Copy
          </button>

          <button
            onClick={openLink}
            disabled={!publicUrl}
            style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb', opacity: publicUrl ? 1 : 0.6 }}
          >
            Open
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => save(true)}
            disabled={saving}
            style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb', opacity: saving ? 0.6 : 1 }}
          >
            Publish
          </button>

          <button
            onClick={() => save(false)}
            disabled={saving}
            style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb', opacity: saving ? 0.6 : 1 }}
          >
            Unpublish
          </button>

          <div style={{ marginLeft: 'auto', opacity: 0.75, alignSelf: 'center' }}>
            Status: <b>{published ? 'Published' : 'Draft'}</b>
          </div>
        </div>

        {/* QR */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 220, height: 220, border: '1px solid #e5e7eb', borderRadius: 14, padding: 10, background: '#fff' }}>
            {qrSrc ? <img src={qrSrc} alt="QR code" width={200} height={200} /> : <div style={{ opacity: 0.6 }}>No QR yet</div>}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontWeight: 700 }}>QR Code</div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
              Print this and place it in-store. Customers scan → open your TikoZap Link → chat.
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
        <Field label="Business name" value={title} onChange={setTitle} />
        <Field label="Tagline" value={tagline} onChange={setTagline} />
        <Field label="Chat greeting (shown on Link page)" value={greeting} onChange={setGreeting} />

        <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Mini storefront details</div>
          <Field label="Logo URL" value={logoUrl} onChange={setLogoUrl} placeholder="https://…/logo.png" />
          <div style={{ height: 10 }} />
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="+1 (555) 123-4567" />
          <div style={{ height: 10 }} />
          <Field label="Address" value={address} onChange={setAddress} placeholder="123 Main St" />
          <div style={{ height: 10 }} />
          <Field label="City" value={city} onChange={setCity} placeholder="New York, NY" />
        </div>

        <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 14 }}>
          <div style={{ fontWeight: 600 }}>Quick buttons (up to 6)</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
            Example: Call, Directions, Instagram, Menu
          </div>

          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            {buttons.map((b, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8 }}>
                <input
                  value={b.label}
                  onChange={(e) => {
                    const next = [...buttons];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setButtons(next);
                  }}
                  placeholder="Label"
                  style={{ padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }}
                />
                <input
                  value={b.url}
                  onChange={(e) => {
                    const next = [...buttons];
                    next[idx] = { ...next[idx], url: e.target.value };
                    setButtons(next);
                  }}
                  placeholder="https://…"
                  style={{ padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }}
                />
                <button
                  onClick={() => setButtons(buttons.filter((_, i) => i !== idx))}
                  style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => buttons.length < 6 && setButtons([...buttons, { label: '', url: '' }])}
              disabled={buttons.length >= 6}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb', opacity: buttons.length >= 6 ? 0.6 : 1 }}
            >
              Add button
            </button>

            <button
              onClick={() => save()}
              disabled={saving}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb', opacity: saving ? 0.6 : 1 }}
            >
              Save
            </button>
          </div>

          {link?.slug && (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              Slug: <code>{link.slug}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 14 }}>
      <div style={{ fontWeight: 600 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ marginTop: 8, width: '100%', padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }}
      />
    </div>
  );
}

// src/app/dashboard/widget/test/widget-test-client.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MobilePageHeader from '../../_components/MobilePageHeader';

export default function WidgetTestClient({
  widgetPublicKey,
  allowedDomains,
}: {
  widgetPublicKey: string;
  allowedDomains: string[];
}) {
  const [origin, setOrigin] = useState('');
  const [domainsText, setDomainsText] = useState((allowedDomains || []).join('\n'));
  const [savingDomains, setSavingDomains] = useState(false);
  const [domainsMsg, setDomainsMsg] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const installScript = useMemo(() => {
    const src = origin ? `${origin}/widget.js` : 'https://js.tikozap.com/widget.js';

    return `<script
  src="${src}"
  data-tikozap-key="${widgetPublicKey}"
></script>`;
  }, [origin, widgetPublicKey]);

  async function copyInstallScript() {
    try {
      await navigator.clipboard.writeText(installScript);
      alert('Install script copied.');
    } catch {
      alert('Could not copy install script.');
    }
  }

  async function saveAllowedDomains() {
    setSavingDomains(true);
    setDomainsMsg('');

    try {
      const res = await fetch('/api/widget/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          allowedDomainsText: domainsText,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Could not save allowed domains.');
      }

      const nextDomains = Array.isArray(data?.widget?.allowedDomains)
        ? data.widget.allowedDomains
        : [];

      setDomainsText(nextDomains.join('\n'));
      setDomainsMsg('Allowed domains saved.');
    } catch (err: any) {
      setDomainsMsg(err?.message || 'Could not save allowed domains.');
    } finally {
      setSavingDomains(false);
    }
  }

  return (
    <div>
      <MobilePageHeader title="Widget" />

      <div className="db-top">
        <div>
          <h1 className="db-title">Widget</h1>
          <p className="db-sub">
            Install your chat assistant on your website, then test messages in Inbox.
          </p>
        </div>
      </div>

      <div className="db-card" style={{ maxWidth: 820, padding: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>
          Install TikoZap on your website
        </div>

        <p style={{ marginTop: 8, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          Copy this script and add it to your website before the closing body tag. If someone
          manages your website for you, send them this script.
        </p>

        <pre
          style={{
            marginTop: 16,
            overflow: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            background: '#f8fafc',
            padding: 14,
            fontSize: 12,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {installScript}
        </pre>

        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="db-btn primary" onClick={copyInstallScript}>
            Copy install script
          </button>

          <Link className="db-btn" href="/dashboard/conversations?testAssistant=1">
            Open Test Assistant
          </Link>

          <Link className="db-btn" href="/dashboard/conversations">
            Go to Inbox
          </Link>
        </div>

        <p style={{ marginTop: 14, fontSize: 12, color: '#64748b' }}>
          Widget key: <span style={{ fontFamily: 'monospace' }}>{widgetPublicKey}</span>
        </p>
      </div>

      <div className="db-card" style={{ maxWidth: 820, padding: 18, marginTop: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>
          Allowed domains
        </div>

        <p style={{ marginTop: 8, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          Add the websites where this widget is allowed to run. Use one domain per line.
          Leave blank while testing locally.
        </p>

        <textarea
          value={domainsText}
          onChange={(e) => setDomainsText(e.target.value)}
          rows={4}
          placeholder={`yourstore.com\nwww.yourstore.com`}
          style={{
            marginTop: 14,
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: 16,
            padding: 14,
            fontSize: 14,
            lineHeight: 1.5,
            resize: 'vertical',
          }}
        />

        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="db-btn primary"
            onClick={saveAllowedDomains}
            disabled={savingDomains}
          >
            {savingDomains ? 'Saving…' : 'Save domains'}
          </button>
        </div>

        {domainsMsg ? (
          <p style={{ marginTop: 10, fontSize: 13, color: '#065f46' }}>
            {domainsMsg}
          </p>
        ) : null}
      </div>

      <div className="db-card" style={{ maxWidth: 820, padding: 18, marginTop: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>
          Test your assistant from Inbox
        </div>

        <p style={{ marginTop: 8, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          The fastest internal test is inside Conversations. Send a shopper-style message and
          confirm the assistant reply appears in the actual thread.
        </p>

        <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
          <div className="db-card" style={{ padding: 14, background: '#f8fafc' }}>
            1. Open the Test Assistant panel.
          </div>
          <div className="db-card" style={{ padding: 14, background: '#f8fafc' }}>
            2. Send a test shopper message.
          </div>
          <div className="db-card" style={{ padding: 14, background: '#f8fafc' }}>
            3. Confirm the message and assistant reply appear in Inbox.
          </div>
        </div>
      </div>
    </div>
  );
}
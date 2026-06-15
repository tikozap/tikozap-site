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

  const starterLink = origin ? `${origin}/l/demo` : 'https://link.tikozap.com/l/your-store';

  const designerInstructions = `Please install TikoZap on our website.

Add this script before the closing </body> tag:

${installScript}

After publishing, please confirm the chat bubble appears on the website.`;

  async function copyText(text: string, msg: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert(msg);
    } catch {
      alert('Could not copy.');
    }
  }

  async function saveAllowedDomains() {
    setSavingDomains(true);
    setDomainsMsg('');

    try {
      const res = await fetch('/api/widget/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ allowedDomainsText: domainsText }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Could not save allowed domains.');

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
          <h1 className="db-title">Add widget</h1>
          <p className="db-sub">
            Choose the setup that fits your business best.
          </p>
        </div>
      </div>

      <div className="db-pageStack">
        <section className="db-card">
          <div className="db-cardTitle">Option 1 - Add widget to your website by yourself</div>
          <p className="db-cardText">
            Copy this script and paste it before the closing body tag on your website.
          </p>

          <pre style={{ marginTop: 14, overflow: 'auto', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, fontSize: 12, whiteSpace: 'pre-wrap' }}>
            {installScript}
          </pre>

          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="db-btn primary" onClick={() => copyText(installScript, 'Install script copied.')}>
              Copy install script
            </button>
            <Link className="db-btn" href="/dashboard/conversations?testAssistant=1">
              Open Test Assistant
            </Link>
          </div>

          <p className="db-cardText" style={{ marginTop: 12 }}>
            Your web designer can usually install this in under 2 minutes.
          </p>
        </section>

        <section className="db-card">
          <div className="db-cardTitle">Option 2 - Send to my web designer</div>
          <p className="db-cardText">
            Copy simple instructions you can forward to the person who manages your website.
          </p>
          <button
            className="db-btn primary"
            style={{ marginTop: 14 }}
            onClick={() => copyText(designerInstructions, 'Instructions copied.')}
          >
            Copy instructions
          </button>
        </section>

        <section className="db-card">
          <div className="db-cardTitle">Option 3 - No website needed</div>
          <p className="db-cardText">
            Use Starter Link to share on Instagram, Facebook, TikTok, Google, or anywhere customers contact you.
          </p>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="db-btn primary" onClick={() => copyText(starterLink, 'TikoZap Link copied.')}>
              Copy my TikoZap Link
            </button>
            <Link className="db-btn" href="/dashboard/tikozap-link">
              Open Starter Link
            </Link>
          </div>
        </section>


        <section className="db-card">
          <div className="db-cardTitle">Option 4 - Shopify installation</div>
          <p className="db-cardText">
            One-click Shopify installation is coming soon.
          </p>
          <button className="db-btn" style={{ marginTop: 14 }}>
            Join waitlist
          </button>
        </section>

        <section className="db-card">
          <div className="db-cardTitle">Allowed domains</div>
          <p className="db-cardText">
            Add the websites where this widget is allowed to run. Use one domain per line.
          </p>

          <textarea
            value={domainsText}
            onChange={(e) => setDomainsText(e.target.value)}
            rows={4}
            placeholder={`yourstore.com\nwww.yourstore.com`}
            style={{ marginTop: 14, width: '100%' }}
          />

          <button
            type="button"
            className="db-btn primary"
            onClick={saveAllowedDomains}
            disabled={savingDomains}
            style={{ marginTop: 12 }}
          >
            {savingDomains ? 'Saving…' : 'Save domains'}
          </button>

          {domainsMsg ? <p className="db-cardText">{domainsMsg}</p> : null}
        </section>
      </div>
    </div>
  );
}
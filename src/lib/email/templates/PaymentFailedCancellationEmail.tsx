// src/lib/email/templates/PaymentFailedCancellationEmail.tsx

import type { CSSProperties } from 'react';

type Props = {
  merchantName?: string | null;
  storeName: string;
  assistantName?: string | null;
  billingUrl: string;
};

const bodyStyle: CSSProperties = {
  margin: 0,
  padding: '32px 16px',
  background: '#f8fafc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: '#111827',
};

const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: 600,
  margin: '0 auto',
  padding: 32,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 18,
  boxSizing: 'border-box',
};

const paragraphStyle: CSSProperties = {
  margin: '0 0 16px',
  fontSize: 16,
  lineHeight: 1.65,
  color: '#374151',
};

const buttonStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 8,
  padding: '12px 18px',
  borderRadius: 10,
  background: '#111827',
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 700,
  textDecoration: 'none',
};

export default function PaymentFailedCancellationEmail({
  merchantName,
  storeName,
  assistantName,
  billingUrl,
}: Props) {
  const firstName =
    String(merchantName || '')
      .trim()
      .split(/\s+/)[0] || '';

  const employeeName =
    String(assistantName || '').trim() ||
    `${storeName} Assistant`;

  return (
    <div style={bodyStyle}>
      <div style={cardStyle}>
        <div
          style={{
            marginBottom: 10,
            color: '#b45309',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Subscription canceled
        </div>

        <h1
          style={{
            margin: '0 0 18px',
            color: '#111827',
            fontSize: 28,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
          }}
        >
          Your TikoZap subscription has been canceled
        </h1>

        <p style={paragraphStyle}>
          {firstName ? `Hi ${firstName},` : 'Hi,'}
        </p>

        <p style={paragraphStyle}>
          We couldn&apos;t complete your subscription payment after multiple
          attempts, so your TikoZap subscription has been canceled.
        </p>

        <p style={paragraphStyle}>
          {employeeName} is now paused, but your assistant, knowledge,
          conversations, and settings remain safely preserved.
        </p>

        <p style={paragraphStyle}>
          You can restart your subscription anytime from Billing.
        </p>

        <a href={billingUrl} style={buttonStyle}>
          Restart TikoZap
        </a>

        <p
          style={{
            margin: '24px 0 0',
            fontSize: 14,
            lineHeight: 1.6,
            color: '#6b7280',
          }}
        >
          — The TikoZap team
        </p>
      </div>
    </div>
  );
}
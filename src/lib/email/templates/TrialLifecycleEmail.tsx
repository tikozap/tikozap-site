// src/lib/email/templates/TrialLifecycleEmail.tsx

import type { CSSProperties } from 'react';

export type TrialEmailStage =
  | '7-days'
  | '5-days'
  | '1-day'
  | 'expired';

type Props = {
  stage: TrialEmailStage;
  merchantName?: string | null;
  storeName: string;
  assistantName?: string | null;
  trialEndsAt?: Date | string | null;
  billingUrl: string;
};

function formatDate(value?: Date | string | null) {
  if (!value) return '';

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

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

export default function TrialLifecycleEmail({
  stage,
  merchantName,
  storeName,
  assistantName,
  trialEndsAt,
  billingUrl,
}: Props) {
const firstName =
  String(merchantName || '')
    .trim()
    .split(/\s+/)[0] || '';

  const employeeName =
    String(assistantName || '').trim() ||
    `${storeName} Assistant`;

  const endingDate = formatDate(trialEndsAt);

  const content = {
    '7-days': {
      eyebrow: '7 days remaining',
      title: `${employeeName} is still helping your store`,
      intro:
        'Your free Pro trial has another 7 days remaining.',
      message:
        `${employeeName}’s knowledge, conversations, and settings will remain ready for you. ` +
        'Choose a plan anytime before the trial ends to keep your assistant serving customers without interruption.',
      button: 'View plans',
    },

    '5-days': {
      eyebrow: '5 days remaining',
      title: `Keep ${employeeName} working for your customers`,
      intro:
        'Your free Pro trial has 5 days remaining.',
      message:
        'Your assistant has already been set up for your store. Choose a plan before the trial ends to keep everything running exactly as it is now.',
      button: 'Choose a plan',
    },

    '1-day': {
      eyebrow: '1 day remaining',
      title: `Your TikoZap trial ends tomorrow`,
      intro:
        'Your free Pro trial has one day remaining.',
      message:
        `${employeeName} will pause when the trial ends unless you choose a plan. ` +
        'Nothing will be deleted—your assistant, knowledge, conversations, and settings will remain safely preserved.',
      button: 'Continue with TikoZap',
    },

    expired: {
      eyebrow: 'Assistant paused',
      title: `Your free trial has ended`,
      intro:
        `${employeeName} is now paused, but everything you created is safely waiting for you.`,
      message:
        'Choose a plan anytime to reactivate your assistant and continue helping customers exactly where you left off. You are always welcome back.',
      button: 'Reactivate my assistant',
    },
  }[stage];

  return (
    <div style={bodyStyle}>
      <div style={cardStyle}>
        <div
          style={{
            marginBottom: 10,
            color: '#2563eb',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {content.eyebrow}
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
          {content.title}
        </h1>

<p style={paragraphStyle}>
  {firstName ? `Hi ${firstName},` : 'Hi,'}
</p>

        <p style={paragraphStyle}>
          {content.intro}
        </p>

        {endingDate && stage !== 'expired' ? (
          <p style={paragraphStyle}>
            Your trial is scheduled to end on{' '}
            <strong>{endingDate}</strong>.
          </p>
        ) : null}

        <p style={paragraphStyle}>
          {content.message}
        </p>

        <a href={billingUrl} style={buttonStyle}>
          {content.button}
        </a>

<p
  style={{
    ...paragraphStyle,
    marginTop: 26,
    marginBottom: 0,
    fontSize: 14,
    color: '#6b7280',
  }}
>
  {employeeName} will be ready to continue helping your customers.
</p>

        <p
          style={{
            margin: '18px 0 0',
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
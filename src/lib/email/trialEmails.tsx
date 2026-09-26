// src/lib/email/trialEmails.tsx

import 'server-only';

import TrialLifecycleEmail, {
  type TrialEmailStage,
} from '@/lib/email/templates/TrialLifecycleEmail';
import { sendEmail } from '@/lib/email/send';

type SendTrialEmailOptions = {
  stage: TrialEmailStage;
  to: string;
  merchantName?: string | null;
  storeName: string;
  assistantName?: string | null;
  trialEndsAt?: Date | string | null;
};

function subjectForStage(
  stage: TrialEmailStage,
  assistantName: string,
) {
  if (stage === '7-days') {
    return `${assistantName} is still helping — 7 days left in your trial`;
  }

  if (stage === '5-days') {
    return `Keep ${assistantName} working — 5 days left`;
  }

  if (stage === '1-day') {
    return `Your TikoZap trial ends tomorrow`;
  }

  return `${assistantName} is paused and ready when you are`;
}

export async function sendTrialLifecycleEmail({
  stage,
  to,
  merchantName,
  storeName,
  assistantName,
  trialEndsAt,
}: SendTrialEmailOptions) {
  const resolvedAssistantName =
    String(assistantName || '').trim() ||
    `${storeName} Assistant`;

  const appBaseUrl = (
    process.env.APP_BASE_URL ||
    'https://app.tikozap.com'
  ).replace(/\/+$/, '');

  const billingUrl =
    `${appBaseUrl}/dashboard/billing`;

  return sendEmail({
    to,
    subject: subjectForStage(
      stage,
      resolvedAssistantName,
    ),
    react: (
      <TrialLifecycleEmail
        stage={stage}
        merchantName={merchantName}
        storeName={storeName}
        assistantName={resolvedAssistantName}
        trialEndsAt={trialEndsAt}
        billingUrl={billingUrl}
      />
    ),
  });
}
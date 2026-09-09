// src/lib/email/paymentFailedCancellationEmail.tsx

import 'server-only';

import PaymentFailedCancellationEmail from '@/lib/email/templates/PaymentFailedCancellationEmail';
import { sendEmail } from '@/lib/email/send';

type SendPaymentFailedCancellationEmailOptions = {
  to: string;
  merchantName?: string | null;
  storeName: string;
  assistantName?: string | null;
  stripeSubscriptionId: string;
};

export async function sendPaymentFailedCancellationEmail({
  to,
  merchantName,
  storeName,
  assistantName,
  stripeSubscriptionId,
}: SendPaymentFailedCancellationEmailOptions) {
  const appBaseUrl = (
    process.env.APP_BASE_URL ||
    'https://app.tikozap.com'
  ).replace(/\/+$/, '');

  const billingUrl =
    `${appBaseUrl}/dashboard/billing`;

  return sendEmail({
    to,
    subject: 'Your TikoZap subscription has been canceled',
    react: (
      <PaymentFailedCancellationEmail
        merchantName={merchantName}
        storeName={storeName}
        assistantName={assistantName}
        billingUrl={billingUrl}
      />
    ),
    idempotencyKey:
      `stripe-payment-failed-cancellation-${stripeSubscriptionId}`,
  });
}
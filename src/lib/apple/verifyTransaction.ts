import 'server-only';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  Environment,
  SignedDataVerifier,
} from '@apple/app-store-server-library';

const BUNDLE_ID = 'com.tikozap.app';
const APP_APPLE_ID = 6804726554;

const PRODUCT_TO_PLAN = {
  'com.tikozap.starter.monthly': 'starter',
  'com.tikozap.pro.monthly': 'pro',
  'com.tikozap.business.monthly': 'business',
} as const;

export type AppleBillingPlan =
  (typeof PRODUCT_TO_PLAN)[keyof typeof PRODUCT_TO_PLAN];

export type VerifiedAppleSubscription = {
  plan: AppleBillingPlan;
  productId: string;
  transactionId: string;
  originalTransactionId: string;
  expiresAt: Date;
  environment: 'Sandbox' | 'Production';
};

function loadAppleRootCertificates(): Buffer[] {
  const certDirectory = join(
    process.cwd(),
    'src',
    'lib',
    'apple',
    'certs'
  );

  return [
    'AppleIncRootCertificate.cer',
    'AppleRootCA-G2.cer',
    'AppleRootCA-G3.cer',
  ].map((filename) =>
    readFileSync(join(certDirectory, filename))
  );
}

const appleRootCertificates = loadAppleRootCertificates();

function createVerifier(environment: Environment) {
  return new SignedDataVerifier(
    appleRootCertificates,
    true,
    environment,
    BUNDLE_ID,
    environment === Environment.PRODUCTION
      ? APP_APPLE_ID
      : undefined
  );
}

const productionVerifier = createVerifier(
  Environment.PRODUCTION
);

const sandboxVerifier = createVerifier(
  Environment.SANDBOX
);

async function verifyForEnvironment(
  signedTransaction: string,
  environment: Environment
) {
  const verifier =
    environment === Environment.PRODUCTION
      ? productionVerifier
      : sandboxVerifier;

  return verifier.verifyAndDecodeTransaction(
    signedTransaction
  );
}

export async function verifyAppleServerNotification(
  signedPayload: string
) {
  try {
    return await productionVerifier.verifyAndDecodeNotification(
      signedPayload
    );
  } catch {
    return sandboxVerifier.verifyAndDecodeNotification(
      signedPayload
    );
  }
}

export async function verifyAppleNotificationTransaction(
  signedTransactionInfo: string,
  environment: Environment | string
) {
  const verifier =
    environment === Environment.PRODUCTION
      ? productionVerifier
      : environment === Environment.SANDBOX
        ? sandboxVerifier
        : null;

  if (!verifier) {
    throw new Error(
      'Apple notification contains an unsupported environment.'
    );
  }

  const transaction =
    await verifier.verifyAndDecodeTransaction(
      signedTransactionInfo
    );

  const productId = transaction.productId;
  const transactionId = transaction.transactionId;
  const originalTransactionId =
    transaction.originalTransactionId;
  const expiresDate = transaction.expiresDate;
  const revocationDate = transaction.revocationDate;

  if (
    !productId ||
    !transactionId ||
    !originalTransactionId ||
    typeof expiresDate !== 'number'
  ) {
    throw new Error(
      'Apple notification transaction is missing required fields.'
    );
  }

  const plan =
    PRODUCT_TO_PLAN[
      productId as keyof typeof PRODUCT_TO_PLAN
    ];

  if (!plan) {
    throw new Error(
      'Apple notification contains an unsupported product.'
    );
  }

  const expiresAt = new Date(expiresDate);

  if (Number.isNaN(expiresAt.getTime())) {
    throw new Error(
      'Apple notification transaction has an invalid expiration date.'
    );
  }

  const revokedAt =
    typeof revocationDate === 'number'
      ? new Date(revocationDate)
      : null;

  if (
    revokedAt &&
    Number.isNaN(revokedAt.getTime())
  ) {
    throw new Error(
      'Apple notification transaction has an invalid revocation date.'
    );
  }

  const isUpgraded = transaction.isUpgraded === true;

  return {
    plan,
    productId,
    transactionId,
    originalTransactionId,
    expiresAt,
    revokedAt,
    isUpgraded,
  };
}

export async function verifyAppleNotificationRenewalInfo(
  signedRenewalInfo: string,
  environment: Environment | string
) {
  const verifier =
    environment === Environment.PRODUCTION
      ? productionVerifier
      : environment === Environment.SANDBOX
        ? sandboxVerifier
        : null;

  if (!verifier) {
    throw new Error(
      'Apple notification contains an unsupported environment.'
    );
  }

  return verifier.verifyAndDecodeRenewalInfo(
    signedRenewalInfo
  );
}

export async function verifyAppleSubscriptionTransaction(
  signedTransaction: string
): Promise<VerifiedAppleSubscription> {
  let transaction;

  try {
    transaction = await verifyForEnvironment(
      signedTransaction,
      Environment.PRODUCTION
    );
  } catch {
    transaction = await verifyForEnvironment(
      signedTransaction,
      Environment.SANDBOX
    );
  }

  const productId = transaction.productId;
  const transactionId = transaction.transactionId;
  const originalTransactionId =
    transaction.originalTransactionId;
  const expiresDate = transaction.expiresDate;
  const revocationDate = transaction.revocationDate;

  if (typeof revocationDate === 'number') {
    throw new Error(
      'Apple subscription transaction has been revoked.'
    );
  }

  if (
    !productId ||
    !transactionId ||
    !originalTransactionId ||
    typeof expiresDate !== 'number'
  ) {
    throw new Error(
      'Apple subscription transaction is missing required fields.'
    );
  }

  const plan =
    PRODUCT_TO_PLAN[
      productId as keyof typeof PRODUCT_TO_PLAN
    ];

  if (!plan) {
    throw new Error(
      'Apple transaction contains an unsupported product.'
    );
  }

  const environment = transaction.environment;

  if (
    environment !== Environment.PRODUCTION &&
    environment !== Environment.SANDBOX
  ) {
    throw new Error(
      'Apple transaction contains an unsupported environment.'
    );
  }

  const expiresAt = new Date(expiresDate);

  if (Number.isNaN(expiresAt.getTime())) {
    throw new Error(
      'Apple subscription transaction has an invalid expiration date.'
    );
  }

  return {
    plan,
    productId,
    transactionId,
    originalTransactionId,
    expiresAt,
    environment,
  };
}

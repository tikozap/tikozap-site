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

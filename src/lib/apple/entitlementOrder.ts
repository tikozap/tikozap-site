export type EntitlementOrder = {
  transactionId: string;
  purchasedAt: Date;
  signedAt: Date;
};
export type StoredOrder = {
  appleTransactionId: string | null;
  appleTransactionPurchasedAt: Date | null;
  appleTransactionSignedAt: Date | null;
};
export function entitlementOrderDecision(stored: StoredOrder, incoming: EntitlementOrder) {
  const oldPurchase = stored.appleTransactionPurchasedAt;
  if (!oldPurchase) return 'apply'; // First verified event initializes existing stores.
  const delta = incoming.purchasedAt.getTime() - oldPurchase.getTime();
  if (delta < 0) return 'older_transaction';
  if (delta > 0) return 'apply'; // Includes a legitimate downgrade at a later renewal.
  if (stored.appleTransactionId !== incoming.transactionId) {
    // Transaction IDs are identifiers, not documented chronological counters.
    throw new Error('Ambiguous Apple transaction order; reconcile with App Store subscription status.');
  }
  if (stored.appleTransactionSignedAt && incoming.signedAt <= stored.appleTransactionSignedAt) {
    return 'older_or_duplicate_state';
  }
  return 'apply';
}

import { Capacitor, registerPlugin } from '@capacitor/core';

export type NativeStoreKitProduct = {
  id: string;
  displayName: string;
  description: string;
  displayPrice: string;
};

export type NativePurchaseResult = {
  status: 'purchased' | 'pending' | 'cancelled';
  productId: string;
  transactionId?: string;
  originalTransactionId?: string;
  signedTransaction?: string;
};

export type NativeRestoreResult = {
  subscriptions: Array<{
    productId: string;
    transactionId: string;
    originalTransactionId: string;
    signedTransaction: string;
  }>;
};

export type NativeUnfinishedTransactionsResult = {
  transactions: Array<{
    productId: string;
    transactionId: string;
    originalTransactionId: string;
    signedTransaction: string;
  }>;
};

interface TikoZapStoreKitPlugin {
  getProducts(): Promise<{
    products: NativeStoreKitProduct[];
  }>;

  purchase(options: {
    productId: string;
  }): Promise<NativePurchaseResult>;

  finishTransaction(options: {
    transactionId: string;
  }): Promise<{
    ok: boolean;
    transactionId: string;
  }>;

  getUnfinishedTransactions(): Promise<NativeUnfinishedTransactionsResult>;
  restorePurchases(): Promise<NativeRestoreResult>;
}

const TikoZapStoreKit =
  registerPlugin<TikoZapStoreKitPlugin>('TikoZapStoreKit');

export function isNativeStoreKitAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

export async function getNativeStoreKitProducts() {
  if (!isNativeStoreKitAvailable()) {
    return [];
  }

  const result = await TikoZapStoreKit.getProducts();
  return result.products;
}

export async function purchaseNativeStoreKitProduct(productId: string) {
  if (!isNativeStoreKitAvailable()) {
    throw new Error('Apple In-App Purchase is available only in the iOS app.');
  }

  return TikoZapStoreKit.purchase({ productId });
}

export async function finishNativeStoreKitTransaction(
  transactionId: string
) {
  if (!isNativeStoreKitAvailable()) {
    throw new Error('Apple In-App Purchase is available only in the iOS app.');
  }

  return TikoZapStoreKit.finishTransaction({
    transactionId,
  });
}

export async function getNativeUnfinishedTransactions() {
  if (!isNativeStoreKitAvailable()) {
    throw new Error('Apple In-App Purchase is available only in the iOS app.');
  }

  return TikoZapStoreKit.getUnfinishedTransactions();
}

export async function restoreNativeStoreKitPurchases() {
  if (!isNativeStoreKitAvailable()) {
    throw new Error('Apple In-App Purchase is available only in the iOS app.');
  }

  return TikoZapStoreKit.restorePurchases();
}

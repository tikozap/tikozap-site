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
};

export type NativeRestoreResult = {
  subscriptions: Array<{
    productId: string;
    transactionId: string;
  }>;
};

interface TikoZapStoreKitPlugin {
  getProducts(): Promise<{
    products: NativeStoreKitProduct[];
  }>;

  purchase(options: {
    productId: string;
  }): Promise<NativePurchaseResult>;

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

export async function restoreNativeStoreKitPurchases() {
  if (!isNativeStoreKitAvailable()) {
    throw new Error('Apple In-App Purchase is available only in the iOS app.');
  }

  return TikoZapStoreKit.restorePurchases();
}

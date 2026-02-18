import { Suspense } from 'react';
import DemoMerchantStart from '../_components/DemoMerchantStart';

export default function DemoLoginPage() {
  return (
    <Suspense fallback={null}>
      <DemoMerchantStart />
    </Suspense>
  );
}

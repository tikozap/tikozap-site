'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const KEY_ONBOARDED = 'tz_demo_onboarded';

export default function FinishOnboarding() {
  const router = useRouter();

  const finish = () => {
    localStorage.setItem(KEY_ONBOARDED, '1');
    router.push('/dashboard');
  };

  return (
    <div className="ob-actions">
      <Link href="/onboarding/install" className="ob-btn">
        Back
      </Link>

      <button onClick={finish} className="ob-btn primary" style={{ cursor: 'pointer' }}>
        Finish
      </button>
    </div>
  );
}

//src/app/onboarding/_components/OnboardingNav.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function OnboardingNav({
  backHref,
  nextHref,
  backLabel = 'Back',
  nextLabel = 'Next',

  // ✅ NEW (optional)
  onNext,
  nextDisabled,
}: {
  backHref?: string;
  nextHref: string;
  backLabel?: string;
  nextLabel?: string;

  // if provided, Next becomes "Save → Next"
  onNext?: () => Promise<boolean> | boolean;
  nextDisabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const disabled = !!nextDisabled || busy;

  async function handleNext() {
    if (!onNext) {
      router.push(nextHref);
      return;
    }

    try {
      setBusy(true);
      const ok = await onNext();
      if (ok !== false) router.push(nextHref);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ob-actions">
      {backHref ? (
        <Link href={backHref} className="ob-btn">
          {backLabel}
        </Link>
      ) : (
        <span />
      )}

      {/* ✅ If onNext exists: button that saves then routes. Otherwise: normal Link */}
      {onNext ? (
        <button
          type="button"
          className="ob-btn primary"
          onClick={handleNext}
          disabled={disabled}
        >
          {busy ? 'Saving…' : nextLabel}
        </button>
      ) : (
        <Link href={nextHref} className="ob-btn primary">
          {nextLabel}
        </Link>
      )}
    </div>
  );
}

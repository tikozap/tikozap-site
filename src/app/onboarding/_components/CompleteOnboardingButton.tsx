// src/app/onboarding/_components/CompleteOnboardingButton.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CompleteOnboardingButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function completeOnboarding() {
    if (saving) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(
        '/api/onboarding/complete',
        {
          method: 'POST',
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            'Could not complete onboarding.',
        );
      }

      router.push(href);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not complete onboarding.',
      );
      setSaving(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="ob-btn primary"
        onClick={completeOnboarding}
        disabled={saving}
        style={{ cursor: saving ? 'wait' : 'pointer' }}
      >
        {saving ? 'Finishing…' : label}
      </button>

      {error ? (
        <p
          style={{
            marginTop: 10,
            color: '#b91c1c',
            fontSize: 13,
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
// src/app/onboarding/billing/page.tsx

import OnboardingNav from '../_components/OnboardingNav';

export default function BillingStep() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Your 14-day Pro trial is ready</h2>
      <p className="mt-1 text-sm opacity-80">
        No credit card required. You can test TikoZap with Pro features before choosing a paid plan.
      </p>

      <div className="mt-6 grid gap-3">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-50 p-4">
          <div className="text-sm font-semibold">Included during trial</div>
          <ul className="mt-3 grid gap-2 text-sm opacity-80">
            <li>✓ Starter Link storefront</li>
            <li>✓ Website widget</li>
            <li>✓ AI assistant + Inbox</li>
            <li>✓ Up to 90 Starter Link products during Pro trial</li>
            <li>✓ Standard AI usage for testing</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold">After the trial</div>
          <p className="mt-1 text-xs opacity-80">
            Choose Starter, Pro, or Business. Heavy AI usage or realtime voice may require an upgrade or add-on.
          </p>
        </div>
      </div>

      <OnboardingNav backHref="/onboarding/store" nextHref="/onboarding/assistant" nextLabel="Continue setup" />
    </div>
  );
}
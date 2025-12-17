import OnboardingNav from '../_components/OnboardingNav';

export default function BillingStep() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Billing</h2>
      <p className="mt-1 text-sm opacity-80">
        For the MVP testing flow, you can start with a trial (no card), then wire Stripe later.
      </p>

      <div className="mt-6 grid gap-3">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-50 p-4">
          <div className="text-sm font-semibold">Start 14-day trial (recommended for testing)</div>
          <p className="mt-1 text-xs opacity-80">Fastest path to test onboarding end-to-end without Stripe wiring.</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold">Pay now (Stripe Checkout / Payment Element)</div>
          <p className="mt-1 text-xs opacity-80">More realistic flow; we’ll wire it when you’re ready.</p>
        </div>
      </div>

      <OnboardingNav backHref="/onboarding/plan" nextHref="/onboarding/knowledge" nextLabel="Continue" />
    </div>
  );
}

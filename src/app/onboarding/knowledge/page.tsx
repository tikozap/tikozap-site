import OnboardingNav from '../_components/OnboardingNav';

export default function KnowledgeStep() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Store knowledge</h2>
      <p className="mt-1 text-sm opacity-80">
        Add the basics your store assistant should know (returns, shipping, sizing). You can improve later.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Return policy</span>
          <textarea
            className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Example: Returns accepted within 30 days. Items must be unworn with tags..."
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Shipping policy</span>
          <textarea
            className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Example: Orders ship in 1–2 business days. US delivery in 3–7 days..."
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Size guide</span>
          <textarea
            className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Example: Runs true to size. If between sizes, size up..."
          />
        </label>
      </div>

      <OnboardingNav backHref="/onboarding/billing" nextHref="/onboarding/widget" />
    </div>
  );
}

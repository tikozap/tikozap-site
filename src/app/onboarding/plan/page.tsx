import OnboardingNav from '../_components/OnboardingNav';

function PlanCard({
  title,
  price,
  desc,
  selected,
}: {
  title: string;
  price: string;
  desc: string;
  selected?: boolean;
}) {
  return (
    <div className={['rounded-2xl border p-4', selected ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white'].join(' ')}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs opacity-80">{desc}</div>
        </div>
        <div className="text-sm font-semibold">{price}</div>
      </div>
      {selected && (
        <div className="mt-3 inline-flex rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
          Selected
        </div>
      )}
    </div>
  );
}

export default function PlanStep() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Choose a plan</h2>
      <p className="mt-1 text-sm opacity-80">Pick a plan for Three Tree Fashion. (Layout-only: Pro is pre-selected.)</p>

      <div className="mt-6 grid gap-3">
        <PlanCard title="Starter" price="$19/mo" desc="Basic widget + FAQs. Good for small shops." />
        <PlanCard title="Pro" price="$49/mo" desc="Recommended for real stores. More chats + better features." selected />
        <PlanCard title="Business" price="$99/mo" desc="Higher limits + team features. Best for growing shops." />
      </div>

      <OnboardingNav backHref="/onboarding/store" nextHref="/onboarding/billing" />
    </div>
  );
}

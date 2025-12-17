import OnboardingNav from '../_components/OnboardingNav';

export default function StoreStep() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Store basics</h2>
      <p className="mt-1 text-sm opacity-80">
        Create your workspace (tenant). For testing, use <span className="font-medium">Three Tree Fashion</span>.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Store name</span>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Three Tree Fashion"
            defaultValue="Three Tree Fashion"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Store website (optional)</span>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="https://threetreefashion.com"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Support email</span>
            <input className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm" placeholder="support@threetreefashion.com" />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Primary category</span>
            <select className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm">
              <option>Women&apos;s fashion</option>
              <option>Beauty</option>
              <option>Electronics</option>
              <option>Home & living</option>
              <option>Other</option>
            </select>
          </label>
        </div>
      </div>

      <OnboardingNav nextHref="/onboarding/plan" />
    </div>
  );
}

// src/app/onboarding/store/page.tsx

import OnboardingNav from '../_components/OnboardingNav';

export default function StoreStep() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Store basics</h2>
      <p className="mt-1 text-sm opacity-80">
        Tell us a little about your store so we can set up your workspace.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Store name</span>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Your Store"
            defaultValue="Your Store"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Store website (optional)</span>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="https://demoboutique.com"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Support email</span>
            <input className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm" placeholder="support@demoboutique.com" />
          </label>

<label className="grid gap-1">
  <span className="text-sm font-medium">Primary category</span>
  <select className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm">
    <option>Fashion</option>
    <option>Beauty</option>
    <option>Electronics</option>
    <option>Home & living</option>
    <option>Food & beverage</option>
    <option>Jewelry & accessories</option>
    <option>Sports & outdoors</option>
    <option>Health & wellness</option>
    <option>Pet supplies</option>
    <option>Flowers & gifts</option>
    <option>Books & stationery</option>
    <option>Other</option>
  </select>
</label>
        </div>
      </div>

      <OnboardingNav nextHref="/onboarding/assistant" />
    </div>
  );
}

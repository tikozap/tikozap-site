// src/app/onboarding/assistant/page.tsx

import OnboardingNav from '../_components/OnboardingNav';

export default function AssistantStep() {
  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Define your AI store assistant
        </h2>

        <p className="text-sm leading-6 opacity-80">
          Set the assistant name, greeting, and a few store details. You can refine everything later.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Assistant name</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
                defaultValue="Demo Boutique Assistant"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Greeting message</span>
              <textarea
                className="min-h-[110px] w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
                defaultValue="Hi! I’m here to help with products, orders, shipping, and returns."
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <div className="text-sm font-semibold">
              Store information (optional)
            </div>

            <p className="mt-1 text-xs leading-5 opacity-75">
              Paste a few important details about your store. You can add more knowledge later.
            </p>
          </div>

          <textarea
            className="min-h-[180px] w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
            placeholder={`Returns accepted within 30 days.

Orders ship in 1–2 business days.

US delivery in 3–7 business days.`}
          />
        </div>
      </div>

      <OnboardingNav
        backHref="/onboarding/store"
        nextHref="/onboarding/install"
        nextLabel="Next: Launch"
      />
    </div>
  );
}
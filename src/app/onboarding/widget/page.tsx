import OnboardingNav from '../_components/OnboardingNav';

export default function WidgetStep() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Widget or Starter Link setup</h2>
      <p className="mt-1 text-sm opacity-80">
        Set your assistant name and greeting once. Use the website widget, or share a
        Starter Link if you do not have a website yet.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Assistant name</span>
            <input
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              defaultValue="Demo Boutique Assistant"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Greeting message</span>
            <textarea
              className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              defaultValue="Hi! I’m here to help with sizing, shipping, returns, and order questions."
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Brand color</span>
            <input type="text" className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm" defaultValue="#111111" />
          </label>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold">Live preview (placeholder)</div>
          <p className="mt-1 text-xs opacity-80">We’ll render the actual widget preview here next.</p>
          <div className="mt-4 rounded-2xl border border-zinc-200 p-4">
            <div className="text-sm font-medium">Demo Boutique Assistant</div>
            <div className="mt-2 text-sm opacity-80">
              Hi! I’m here to help with sizing, shipping, returns, and order questions.
            </div>
            <div className="mt-4 rounded-xl border border-zinc-200 px-3 py-2 text-sm opacity-70">
              Type a message…
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="text-sm font-semibold">Starter Link mode (no website)</div>
        <p className="mt-1 text-xs opacity-80">
          We generate a shareable support link that opens this same assistant flow in a
          hosted page.
        </p>
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">
          https://app.tikozap.com/s/demo-boutique
        </div>
      </div>

      <OnboardingNav backHref="/onboarding/knowledge" nextHref="/onboarding/install" />
    </div>
  );
}

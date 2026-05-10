// src/app/onboarding/assistant/page.tsx

import OnboardingNav from '../_components/OnboardingNav';

const EXAMPLE_QUESTIONS = [
  'Where is my order?',
  'What is your return policy?',
  'Do you have this in another size?',
];

const TRUST_POINTS = [
  'Answers common support questions 24/7',
  'Reduces repetitive customer support work',
  'Hands off to a human when needed',
];

export default function AssistantStep() {
  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Build your AI store assistant</h2>
        <p className="text-sm leading-6 opacity-80">
          Set the tone, teach the basics, and choose how customers reach you. You can refine
          everything later.
        </p>
      </div>

<div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
  <div className="text-sm font-semibold text-emerald-950">
    Your 14-day Pro trial is active
  </div>
  <p className="mt-1 text-xs leading-5 text-emerald-900/80">
    No credit card required. You can test Starter Link, website widget, Inbox,
    and AI assistant before choosing a paid plan.
  </p>
</div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
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
                  className="min-h-[120px] w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
                  defaultValue="Hi! I’m here to help with sizing, shipping, returns, and order questions."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">Brand color</span>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
                    defaultValue="#111111"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">Color swatch</span>
                  <div className="flex h-[50px] items-center rounded-2xl border border-zinc-300 bg-white px-3">
                    <div
                      className="h-7 w-7 rounded-full border border-black/10"
                      style={{ background: '#111111' }}
                    />
                    <span className="ml-3 text-xs text-zinc-500">Primary</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <div className="text-sm font-semibold">Store knowledge</div>
              <p className="mt-1 text-xs leading-5 opacity-75">
                Start with your most repeated support topics. You can expand this later.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Return policy</span>
                <textarea
                  className="min-h-[120px] w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
                  placeholder="Returns accepted within 30 days. Items must be unworn with tags..."
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Shipping policy</span>
                <textarea
                  className="min-h-[120px] w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
                  placeholder="Orders ship in 1–2 business days. US delivery in 3–7 days..."
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Size guide</span>
                <textarea
                  className="min-h-[120px] w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm"
                  placeholder="Runs true to size. If between sizes, size up..."
                />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="text-sm font-semibold">Choose your first channel</div>
            <p className="mt-1 text-xs leading-5 opacity-75">
              You can use both later. Pick the fastest path to launch first.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-sm">
                    💬
                  </div>
                  <div className="text-sm font-semibold">Website Widget</div>
                </div>
                <p className="mt-3 text-xs leading-5 opacity-75">
                  Best if your store already has a website and you want the assistant bubble
                  on your storefront.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-900 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-sm text-white">
                    ↗
                  </div>
                  <div className="text-sm font-semibold">Starter Link</div>
                </div>
                <p className="mt-3 text-xs leading-5 opacity-75">
                  Best if you want a hosted support page you can share right away, even
                  without a website.
                </p>
                <div className="mt-3 inline-flex rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-medium text-white">
                  Fastest launch path
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                style={{ background: '#111111' }}
              >
                AI
              </div>
              <div>
                <div className="text-sm font-semibold">Demo Boutique Assistant</div>
                <div className="text-xs opacity-70">Live preview</div>
              </div>
            </div>

            <div className="mt-5 rounded-[28px] border border-zinc-200 bg-zinc-50 p-4">
              <div className="space-y-3">
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-800">
                    Hi! I’m here to help with sizing, shipping, returns, and order questions.
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-zinc-900 px-4 py-3 text-sm leading-6 text-white">
                    Where is my order?
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-800">
                    I can help with order status. If you share your order number or email, I’ll
                    point you in the right direction.
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-400">
                Type a message…
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-60">
                Example customer questions
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMPLE_QUESTIONS.map((item) => (
                  <div
                    key={item}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="text-sm font-semibold">Why merchants use this</div>
            <div className="mt-4 grid gap-3">
              {TRUST_POINTS.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3"
                >
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[11px] text-white">
                    ✓
                  </div>
                  <div className="text-sm leading-6 text-zinc-700">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <OnboardingNav backHref="/onboarding/store" nextHref="/onboarding/install" nextLabel="Next: Launch" />
    </div>
  );
}
// src/app/onboarding/install/page.tsx

import OnboardingNav from '../_components/OnboardingNav';

export default function InstallStep() {
  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Launch</h2>

        <p className="text-sm leading-6 opacity-80">
          Your TikoZap workspace is ready.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold">You can now:</p>

        <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">
          <li>• Test your assistant in Inbox</li>
          <li>• Install your website widget later</li>
          <li>• Use Starter Link if you don&apos;t have a website</li>
          <li>• Update settings anytime from the Dashboard</li>
        </ul>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
        <input type="checkbox" className="mt-1" />
        <span>
          I completed the initial setup and I&apos;m ready to test in Inbox.
        </span>
      </label>

      <OnboardingNav
        backHref="/onboarding/assistant"
        nextHref="/dashboard/conversations"
        nextLabel="Go to Inbox"
      />
    </div>
  );
}
// src/app/onboarding/install/page.tsx

import OnboardingNav from '../_components/OnboardingNav';
import { getAuthedUserAndTenant } from '@/lib/auth';

export default async function InstallStep() {
  const auth = await getAuthedUserAndTenant();

  const isStarterLinkStore = auth?.tenant?.starterLinkEnabled === true;

const nextHref = isStarterLinkStore
  ? '/dashboard/tikozap-link'
  : '/dashboard/widget';

const nextLabel = isStarterLinkStore
  ? 'Go to Starter Link'
  : 'Go to Widget';

  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Launch</h2>

        <p className="text-sm leading-6 opacity-80">
          Your TikoZap workspace is ready. You can do these in your Dashboard:
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">
          <li>Install your website chat widget</li>
          <li>Test your AI assistant in Inbox</li>
          <li>Use Starter Link if you don&apos;t have a website</li>
          <li>Teach your AI assistant how to help customers</li>
          <li>Update settings anytime</li>
        </ul>
      </div>

      <label className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
        <input
          type="checkbox"
          className="shrink-0"
          style={{
            width: 16,
            height: 16,
            margin: 0,
            marginRight: 8,
            transform: 'translateY(19px)',
          }}
        />

        <span className="leading-5">
          I completed the initial setup and I&apos;m ready for my Dashboard.
        </span>
      </label>

      <OnboardingNav
        backHref="/onboarding/assistant"
        nextHref={nextHref}
        nextLabel={nextLabel}
      />
    </div>
  );
}
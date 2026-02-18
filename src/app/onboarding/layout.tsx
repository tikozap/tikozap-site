import type { ReactNode } from 'react';
import './onboarding.css';
import OnboardingStepper from './_components/OnboardingStepper';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <main className="ob-container">
      <header className="ob-header">
        <h1>Set up your store</h1>
        <p>
          You’re creating your first merchant workspace in TikoZap. (Test tenant:{' '}
          <strong>Demo Boutique</strong>)
        </p>
        <p style={{ marginTop: '.35rem', fontSize: '.9rem', opacity: 0.8 }}>
          You can launch with a website widget or share a Starter Link if you do not have a
          website yet.
        </p>
      </header>

      <OnboardingStepper />

      <section className="ob-card">{children}</section>

      <p style={{ marginTop: '1.25rem', fontSize: '.8rem', opacity: 0.7 }}>
        Layout-only for now. Next we’ll wire auth → tenant creation → billing → widget install → inbox.
      </p>
    </main>
  );
}

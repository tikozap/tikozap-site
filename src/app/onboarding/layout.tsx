// src/app/onboarding/layout.tsx
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
      </header>

      <OnboardingStepper />

      <section className="ob-card">{children}</section>

      <p style={{ marginTop: '1.25rem', fontSize: '.8rem', opacity: 0.7 }}>
        Layout-only for now. Next we’ll wire auth → tenant creation → billing → widget install → inbox.
      </p>
    </main>
  );
}

// src/app/onboarding/layout.tsx

import type { ReactNode } from 'react';
import './onboarding.css';
import OnboardingStepper from './_components/OnboardingStepper';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <main className="ob-shell">
      <div className="ob-bgGlow ob-bgGlowA" />
      <div className="ob-bgGlow ob-bgGlowB" />

      <section className="ob-hero">
        <h1 className="ob-title">Initial Setup</h1>
      </section>

      <section className="ob-stepperWrap">
        <OnboardingStepper />
      </section>

      <section className="ob-card ob-cardScroll">{children}</section>
    </main>
  );
}
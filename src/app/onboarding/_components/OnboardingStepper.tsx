// src/app/onboarding/_components/OnboardingStepper.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STEPS = [
  { key: 'store', label: 'Store Basic', href: '/onboarding/store' },
  { key: 'assistant', label: 'Assistant', href: '/onboarding/assistant' },
  { key: 'launch', label: 'Launch', href: '/onboarding/install' },
];

export default function OnboardingStepper() {
  const pathname = usePathname() || '';
  const activeIndex = Math.max(
    0,
    STEPS.findIndex((s) => pathname.startsWith(s.href))
  );

  return (
    <nav aria-label="Onboarding steps" className="ob-stepper">
      <ol>
        {STEPS.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isActive = idx === activeIndex;

          const cls = ['ob-step', isDone ? 'is-done' : '', isActive ? 'is-active' : '']
            .filter(Boolean)
            .join(' ');

          return (
            <li key={step.key}>
              <Link href={step.href} className={cls}>
                <span className="ob-badge">{idx + 1}</span>
                <span className="ob-label">{step.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
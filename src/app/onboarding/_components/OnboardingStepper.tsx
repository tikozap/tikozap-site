'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STEPS = [
  { key: 'store', label: 'Store', href: '/onboarding/store' },
  { key: 'plan', label: 'Plan', href: '/onboarding/plan' },
  { key: 'billing', label: 'Billing', href: '/onboarding/billing' },
  { key: 'knowledge', label: 'Knowledge', href: '/onboarding/knowledge' },
  { key: 'widget', label: 'Widget / Link', href: '/onboarding/widget' },
  { key: 'install', label: 'Install / Share', href: '/onboarding/install' },
  { key: 'test', label: 'Test', href: '/onboarding/test' },
];

export default function OnboardingStepper() {
  const pathname = usePathname() || '';
  const activeIndex = Math.max(0, STEPS.findIndex((s) => pathname.startsWith(s.href)));

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

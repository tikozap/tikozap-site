// src/app/onboarding/knowledge/page.tsx
import OnboardingNav from '../_components/OnboardingNav';
import KnowledgeEditor from '@/app/_components/KnowledgeEditor';

export default function KnowledgeStep() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Store knowledge</h2>
      <p className="mt-1 text-sm opacity-80">
        Add the basics your store assistant should know. You can edit anytime later in the Dashboard → Knowledge.
      </p>

      <KnowledgeEditor />

      <OnboardingNav backHref="/onboarding/billing" nextHref="/onboarding/widget" />
    </div>
  );
}

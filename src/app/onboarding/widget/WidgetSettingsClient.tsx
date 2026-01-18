import OnboardingNav from '../_components/OnboardingNav';
import WidgetSettingsClient from './WidgetSettingsClient';

export default function WidgetStep() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Widget setup</h2>
      <p className="mt-1 text-sm opacity-80">Set the store assistant name, greeting, and basic appearance.</p>

      <WidgetSettingsClient />

      <OnboardingNav backHref="/onboarding/knowledge" nextHref="/onboarding/install" />
    </div>
  );
}

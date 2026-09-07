// src/lib/onboardingConfig.ts

export type EntryMode = 'starter-link' | 'website';

export type DemoOnboardingConfig = {
  entryMode: EntryMode;
  assistantName: string;
  greeting: string;
  brandColor: string;
  tagline: string;
  prompt1: string;
  prompt2: string;
  prompt3: string;
};

export const DEFAULT_DEMO_ONBOARDING_CONFIG: DemoOnboardingConfig = {
  entryMode: 'starter-link',
  assistantName: 'Demo Boutique Assistant',
  greeting:
    'Hi! I’m here to help with sizing, shipping, returns, order questions, and product search.',
  brandColor: '#111111',
  tagline: 'Shop smarter with AI assistance.',
  prompt1: 'Show me best sellers',
  prompt2: 'Track my order',
  prompt3: 'Find something under $50',
};

export const KEY_ONBOARDING_CONFIG = 'tz_demo_onboarding_config';
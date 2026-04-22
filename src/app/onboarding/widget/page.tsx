// src/app/onboarding/widget/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import OnboardingNav from '../_components/OnboardingNav';
import {
  DEFAULT_DEMO_ONBOARDING_CONFIG,
  KEY_ONBOARDING_CONFIG,
  type EntryMode,
} from '@/lib/onboardingConfig';

export default function WidgetStep() {
  const [mode, setMode] = useState<EntryMode>('starter-link');

  const [assistantName, setAssistantName] = useState(DEFAULT_DEMO_ONBOARDING_CONFIG.assistantName);
  const [greeting, setGreeting] = useState(DEFAULT_DEMO_ONBOARDING_CONFIG.greeting);
  const [brandColor, setBrandColor] = useState(DEFAULT_DEMO_ONBOARDING_CONFIG.brandColor);

  const [tagline, setTagline] = useState(DEFAULT_DEMO_ONBOARDING_CONFIG.tagline);
  const [websiteUrl, setWebsiteUrl] = useState('https://demoboutique.com');

  const [prompt1, setPrompt1] = useState(DEFAULT_DEMO_ONBOARDING_CONFIG.prompt1);
  const [prompt2, setPrompt2] = useState(DEFAULT_DEMO_ONBOARDING_CONFIG.prompt2);
  const [prompt3, setPrompt3] = useState(DEFAULT_DEMO_ONBOARDING_CONFIG.prompt3);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(KEY_ONBOARDING_CONFIG);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      setMode(parsed.entryMode === 'website' ? 'website' : 'starter-link');
      setAssistantName(parsed.assistantName || DEFAULT_DEMO_ONBOARDING_CONFIG.assistantName);
      setGreeting(parsed.greeting || DEFAULT_DEMO_ONBOARDING_CONFIG.greeting);
      setBrandColor(parsed.brandColor || DEFAULT_DEMO_ONBOARDING_CONFIG.brandColor);
      setTagline(parsed.tagline || DEFAULT_DEMO_ONBOARDING_CONFIG.tagline);
      setPrompt1(parsed.prompt1 || DEFAULT_DEMO_ONBOARDING_CONFIG.prompt1);
      setPrompt2(parsed.prompt2 || DEFAULT_DEMO_ONBOARDING_CONFIG.prompt2);
      setPrompt3(parsed.prompt3 || DEFAULT_DEMO_ONBOARDING_CONFIG.prompt3);
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const next = {
      entryMode: mode,
      assistantName,
      greeting,
      brandColor,
      tagline,
      prompt1,
      prompt2,
      prompt3,
    };
    window.localStorage.setItem(KEY_ONBOARDING_CONFIG, JSON.stringify(next));
  }, [mode, assistantName, greeting, brandColor, tagline, prompt1, prompt2, prompt3]);

  const starterLink = useMemo(() => {
    return 'https://link.tikozap.com/l/demo-boutique';
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold">Website or Starter Link</h2>
      <p className="mt-1 text-sm opacity-80">
        Choose how customers will reach your assistant. You can install TikoZap on your
        website, use a Starter Link if you do not have a website, or use both later.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode('website')}
          className={[
            'rounded-2xl border p-4 text-left transition',
            mode === 'website'
              ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
              : 'border-zinc-200 bg-white hover:bg-zinc-50',
          ].join(' ')}
        >
          <div className="text-sm font-semibold">I have a website</div>
          <p className="mt-1 text-sm opacity-80">
            Install a chat bubble on your existing storefront. Best for stores with their
            own website.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode('starter-link')}
          className={[
            'rounded-2xl border p-4 text-left transition',
            mode === 'starter-link'
              ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
              : 'border-zinc-200 bg-white hover:bg-zinc-50',
          ].join(' ')}
        >
          <div className="text-sm font-semibold">I don’t have a website</div>
          <p className="mt-1 text-sm opacity-80">
            Create a Starter Link page your customers can open and chat with. No website
            needed.
          </p>
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="grid gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-sm font-semibold">Assistant setup</div>
            <p className="mt-1 text-xs opacity-75">
              Set the assistant identity once. The same assistant can power your website
              widget or Starter Link.
            </p>

            <div className="mt-4 grid gap-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium">Assistant name</span>
                <input
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Greeting message</span>
                <textarea
                  className="min-h-[110px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Brand color</span>
                <input
                  type="text"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                />
              </label>
            </div>
          </div>

          {mode === 'website' ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold">Website widget</div>
              <p className="mt-1 text-xs opacity-75">
                Install a chat bubble on your site and let customers ask product and
                support questions directly on your storefront.
              </p>

              <div className="mt-4 grid gap-4">
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Website URL</span>
                  <input
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </label>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Install snippet
                  </div>
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs leading-5 opacity-90">
{`<script
  src="https://js.tikozap.com/widget.js"
  data-tikozap-key="tz_your_public_key"
  data-tikozap-channel="web"
></script>`}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold">Starter Link — No Website Needed</div>
              <p className="mt-1 text-xs opacity-75">
                Create a simple AI store page customers can open and chat with.
              </p>

              <div className="mt-4 grid gap-4">
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Store tagline</span>
                  <input
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                  />
                </label>

                <div className="grid gap-3">
                  <div className="text-sm font-medium">Quick prompts</div>

                  <input
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    value={prompt1}
                    onChange={(e) => setPrompt1(e.target.value)}
                  />
                  <input
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    value={prompt2}
                    onChange={(e) => setPrompt2(e.target.value)}
                  />
                  <input
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    value={prompt3}
                    onChange={(e) => setPrompt3(e.target.value)}
                  />
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Shareable link
                  </div>
                  <div className="mt-2 break-all text-sm">{starterLink}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold">Live preview</div>
          <p className="mt-1 text-xs opacity-75">
            Preview how customers will meet your assistant.
          </p>

          {mode === 'website' ? (
            <div className="mt-4 rounded-2xl border border-zinc-200 p-4">
              <div className="text-sm font-medium">Website widget preview</div>
              <div className="mt-3 rounded-xl border border-zinc-200 p-3">
                <div className="text-sm font-semibold">{assistantName}</div>
                <div className="mt-2 text-sm opacity-80">{greeting}</div>
                <div className="mt-4 flex justify-end">
                  <div
                    className="rounded-full px-4 py-2 text-sm text-white"
                    style={{ backgroundColor: brandColor || '#111111' }}
                  >
                    Chat bubble
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm opacity-80">
                Installed on: {websiteUrl || 'your website'}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-zinc-200 p-4">
              <div className="text-sm font-medium">Starter Link preview</div>

              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-lg font-semibold">Demo Boutique</div>
                <div className="mt-1 text-sm opacity-75">{tagline}</div>

                <div className="mt-4 rounded-xl border border-zinc-200 p-3">
                  <div className="text-sm font-semibold">{assistantName}</div>
                  <div className="mt-2 text-sm opacity-80">{greeting}</div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[prompt1, prompt2, prompt3]
                    .filter(Boolean)
                    .map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="rounded-full border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
                      >
                        {prompt}
                      </button>
                    ))}
                </div>

                <div className="mt-5 rounded-xl border border-zinc-200 px-3 py-2 text-sm opacity-70">
                  Chat opens here…
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
                Public page: {starterLink}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="text-sm font-semibold">Recommended setup</div>
        <p className="mt-1 text-sm opacity-80">
          Start with one entry mode now. You can always use both later — website widget
          for your storefront, plus Starter Link for social sharing.
        </p>
      </div>

      <OnboardingNav backHref="/onboarding/knowledge" nextHref="/onboarding/install" />
    </div>
  );
}
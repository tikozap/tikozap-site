// src/app/dashboard/assistant/_components/useAssistantIdentity.ts

'use client';

import { useEffect, useState } from 'react';

const FALLBACK_NAME = 'Your assistant';

export function useAssistantIdentity() {
  const [assistantName, setAssistantName] = useState(FALLBACK_NAME);

  useEffect(() => {
    const loadIdentity = async () => {
      try {
        const cached =
          localStorage.getItem('tz_assistant_name')?.trim() ||
          localStorage.getItem('tz_settings_cache');

        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const cachedName = parsed?.tz_assistant_name?.trim();

            if (cachedName) {
              setAssistantName(cachedName);
            }
          } catch {
            if (cached.trim()) {
              setAssistantName(cached.trim());
            }
          }
        }

        const response = await fetch('/api/settings', {
          cache: 'no-store',
        });

        const data = await response.json();
        const savedName =
          data?.settings?.tz_assistant_name?.trim();

        if (savedName) {
          setAssistantName(savedName);
        }
      } catch {
        // Keep the safe fallback or cached name.
      }
    };

    void loadIdentity();

    const handleSettingsChange = () => {
      void loadIdentity();
    };

    window.addEventListener(
      'tz-settings-change',
      handleSettingsChange
    );

    return () => {
      window.removeEventListener(
        'tz-settings-change',
        handleSettingsChange
      );
    };
  }, []);

  return {
    assistantName,
  };
}
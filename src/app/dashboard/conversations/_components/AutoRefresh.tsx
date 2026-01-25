// src/app/dashboard/conversations/_components/AutoRefresh.tsx
'use client';

import { useEffect } from 'react';

function isTyping() {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}

export default function AutoRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (isTyping()) return;
      window.dispatchEvent(new Event('tz:refresh'));
    };

    tick(); // one refresh on enter
    const id = window.setInterval(tick, intervalMs);

    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [intervalMs]);

  return null;
}

// src/components/dashboard/AutoRefresh.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function isTyping() {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}

export default function AutoRefresh({
  intervalMs = 2000,
  enabled = true,
}: {
  intervalMs?: number;
  enabled?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const id = window.setInterval(() => {
      // Don’t refresh if tab is hidden or you’re typing a reply
      if (document.hidden) return;
      if (isTyping()) return;

      router.refresh();
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [enabled, intervalMs, router]);

  return null;
}

// src/app/dashboard/conversations/_components/AutoRefresh.tsx
'use client';

import { useEffect } from 'react';

export default function AutoRefresh({ intervalMs = 8000 }: { intervalMs?: number }) {
  useEffect(() => {
    const tick = () => window.dispatchEvent(new Event('tz:refresh'));

    tick(); // ✅ immediate refresh on mount
    const id = window.setInterval(tick, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs]);

  return null;
}

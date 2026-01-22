// src/app/dashboard/conversations/_components/AutoRefresh.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoRefresh({ intervalMs = 2000 }: { intervalMs?: number }) {
  const router = useRouter();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const stop = () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };

    const tick = () => {
      if (document.hidden) return;

      // 1) Refresh any server components (safe even if you have none here)
      router.refresh();

      // 2) Also notify client components to refetch their own data
      window.dispatchEvent(new Event('tz:refresh'));
    };

    const start = () => {
      stop();
      timerRef.current = window.setInterval(tick, intervalMs);
    };

    const onVis = () => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [router, intervalMs]);

  return null;
}

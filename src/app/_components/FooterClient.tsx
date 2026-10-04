// src/app/_components/FooterClient.tsx
'use client';

import { usePathname } from 'next/navigation';

export default function FooterClient() {
  const pathname = usePathname() || '';

  // ✅ Hide footer on Starter Link pages
  if (pathname.startsWith('/s/')) return null;

  return (
    <footer style={{ marginTop: 48, padding: 24, borderTop: '1px solid #e5e7eb', opacity: 0.8 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 13 }}>© {new Date().getFullYear()} TikoZap</div>
      </div>
    </footer>
  );
}
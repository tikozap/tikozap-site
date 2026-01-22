// src/app/l/[slug]/_components/StarterWidgetEmbed.tsx
'use client';

import { useEffect, useRef } from 'react';

export default function StarterWidgetEmbed({ publicKey }: { publicKey: string }) {
  const injectedRef = useRef(false);

  useEffect(() => {
    if (!publicKey) return;
    if (injectedRef.current) return;
    injectedRef.current = true;

    // Remove any existing widget script tag (defensive)
    const existing = document.querySelector('script[data-tikozap-key]');
    if (existing) existing.remove();

    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://js.tikozap.com/widget.js';
    s.setAttribute('data-tikozap-key', publicKey);

    // Starter Link behavior
    s.setAttribute('data-tikozap-open', '1');
    s.setAttribute('data-tikozap-tags', 'link');
    s.setAttribute('data-tikozap-channel', 'link');
    s.setAttribute('data-tikozap-subject', 'TikoZap Link');
    s.setAttribute('data-tikozap-customer-name', 'Link visitor');

    document.body.appendChild(s);

    return () => {
      s.remove();
    };
  }, [publicKey]);

  return null;
}

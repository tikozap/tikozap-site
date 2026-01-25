// src/app/l/[slug]/_components/StarterWidgetEmbed.tsx
'use client';

import { useEffect, useRef } from 'react';

function isLocalhost(host: string) {
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
}

function getVisitorName(publicKey: string) {
  try {
    const k = `tz_link_visitor_${publicKey}`;
    const existing = localStorage.getItem(k);
    if (existing) return existing;
    const v = `Link visitor ${Math.random().toString(16).slice(2, 6)}`;
    localStorage.setItem(k, v);
    return v;
  } catch {
    return 'Link visitor';
  }
}

export default function StarterWidgetEmbed({ publicKey }: { publicKey: string }) {
  const injectedRef = useRef(false);

  useEffect(() => {
    if (!publicKey) return;
    if (injectedRef.current) return;
    injectedRef.current = true;

    // Remove only OUR embed script (don’t touch other scripts)
    const existing = document.querySelector('script[data-tikozap-embed="starter-link"]');
    if (existing) existing.remove();

    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://js.tikozap.com/widget.js';
    s.setAttribute('data-tikozap-embed', 'starter-link');

    // Key
    s.setAttribute('data-tikozap-key', publicKey);

    // Starter Link behavior / attribution
    s.setAttribute('data-tikozap-open', '1');
    s.setAttribute('data-tikozap-tags', 'link');
    s.setAttribute('data-tikozap-channel', 'link');
    s.setAttribute('data-tikozap-subject', 'TikoZap Link');
    s.setAttribute('data-tikozap-customer-name', getVisitorName(publicKey));

    // LOCAL DEV: force API base to your dev server so it hits localhost APIs
    // PROD: do nothing (widget.js will use https://api.tikozap.com)
    const apiBaseFromEnv = process.env.NEXT_PUBLIC_API_BASE || '';
    const apiBase =
      apiBaseFromEnv ||
      (isLocalhost(window.location.hostname) ? window.location.origin : '');

    if (apiBase) s.setAttribute('data-tikozap-api-base', apiBase);

    document.body.appendChild(s);

    return () => {
      s.remove();
    };
  }, [publicKey]);

  return null;
}

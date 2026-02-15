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
    s.src = "https://js.tikozap.com/widget.js";
    s.async = true;
    s.setAttribute('data-tikozap-embed', 'starter-link');
    s.setAttribute('data-tikozap-key', publicKey);
    s.setAttribute('data-tikozap-open', '1');
    s.setAttribute('data-tikozap-channel', 'link');
    s.setAttribute('data-tikozap-tags', 'link');
    s.setAttribute("data-tikozap-customer-name", getVisitorName(publicKey));
    s.setAttribute("data-tikozap-subject", "TikoZap Link");

    // ✅ critical: make it call the SAME host the link page is served from
    s.setAttribute("data-tikozap-api-base", window.location.origin);

    document.body.appendChild(s);

    s.onload = () => console.log("[starter-link] widget.js loaded");
    s.onerror = () => console.error("[starter-link] widget.js failed to load");
   console.log("[starter-link] apiBase =", s.getAttribute("data-tikozap-api-base"));

    return () => {
      s.remove();
    };
  }, [publicKey]);

  return null;
}

// src/app/s/[slug]/_components/StarterWidgetEmbed.tsx
"use client";

import { useEffect, useRef } from "react";

function isLocalhost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
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
    return "Link visitor";
  }
}

export default function StarterWidgetEmbed({ publicKey }: { publicKey: string }) {
  const injectedRef = useRef(false);

  useEffect(() => {
    if (!publicKey) return;
    if (injectedRef.current) return;
    injectedRef.current = true;

    // Remove only OUR embed script
    const existing = document.querySelector('script[data-tikozap-embed="starter-link"]');
    if (existing) existing.remove();

    const host = window.location.hostname;
    const local = isLocalhost(host);

    // ✅ IMPORTANT:
    // - local dev: use same-origin /widget.js (never depends on js.tikozap.com)
    // - production: use https://js.tikozap.com/widget.js
    const src = local ? `${window.location.origin}/widget.js` : "https://js.tikozap.com/widget.js";

    const s = document.createElement("script");
    s.src = src;
    s.async = true;

    s.setAttribute("data-tikozap-embed", "starter-link");
    s.setAttribute("data-tikozap-key", publicKey);

    // Auto-open on Starter Link
    s.setAttribute("data-tikozap-open", "1");

    // Tag messages as link channel
    s.setAttribute("data-tikozap-channel", "link");
    s.setAttribute("data-tikozap-tags", "link");
    s.setAttribute("data-tikozap-subject", "Starter Link");
    s.setAttribute("data-tikozap-customer-name", getVisitorName(publicKey));

    // ✅ critical: call same host this page is served from
    s.setAttribute("data-tikozap-api-base", window.location.origin);

    document.body.appendChild(s);

    s.onload = () => console.log("[starter-link] widget.js loaded:", src);
    s.onerror = () => console.error("[starter-link] widget.js failed to load:", src);

    return () => {
      s.remove();
    };
  }, [publicKey]);

  return null;
}
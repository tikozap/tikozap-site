// src/app/l/[slug]/_components/StarterWidgetEmbed.tsx
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

    const existing = document.querySelector('script[data-tikozap-embed="starter-link"]');
    if (existing) existing.remove();

    const s = document.createElement("script");

    // ✅ local dev uses same origin /widget.js; prod uses js.tikozap.com
    const local = isLocalhost(window.location.hostname);
    s.src = local ? `${window.location.origin}/widget.js` : "https://js.tikozap.com/widget.js";

    s.async = true;
    s.setAttribute("data-tikozap-embed", "starter-link");
    s.setAttribute("data-tikozap-key", publicKey);

    // ✅ Starter Link defaults
    s.setAttribute("data-tikozap-open", "0");
    s.setAttribute("data-tikozap-channel", "starter-link");
    s.setAttribute("data-tikozap-tags", "starter-link,no-website");
    s.setAttribute("data-tikozap-customer-name", getVisitorName(publicKey));
    s.setAttribute("data-tikozap-subject", "Starter Link");

    // ✅ call same host as the page
    s.setAttribute("data-tikozap-api-base", window.location.origin);

    document.body.classList.add("tz-starter-link");
    document.body.appendChild(s);

    s.onload = () => console.log("[starter-link] widget.js loaded:", s.src);
    s.onerror = () => console.error("[starter-link] widget.js failed:", s.src);

    return () => s.remove();
  }, [publicKey]);

  return null;
}
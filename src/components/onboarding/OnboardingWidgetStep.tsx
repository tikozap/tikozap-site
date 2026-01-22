// src/components/onboarding/OnboardingWidgetStep.tsx
"use client";

import { useMemo, useState } from "react";

function copy(text: string) {
  return navigator.clipboard.writeText(text);
}

export function OnboardingWidgetStep({
  widgetKey,
  storeSlug,
}: {
  widgetKey: string;
  storeSlug: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const snippet = useMemo(() => {
    return `<!-- TikoZap Widget -->
<script async src="https://js.tikozap.com/widget.js" data-tikozap-key="${widgetKey}"></script>`;
  }, [widgetKey]);

  const linkUrl = useMemo(() => {
    return `https://link.tikozap.com/${storeSlug}`;
  }, [storeSlug]);

  async function doCopy(which: string, text: string) {
    await copy(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Install your TikoZap widget</h2>
        <p className="text-sm text-gray-600">
          Choose the option that matches your store. You can change widget settings anytime.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Website */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="font-semibold">Website</div>
          <p className="mt-1 text-sm text-gray-600">
            Paste this before <code className="text-xs">&lt;/body&gt;</code>.
          </p>

          <pre className="mt-3 max-h-44 overflow-auto rounded-xl bg-gray-50 p-3 text-xs">
            {snippet}
          </pre>

          <button
            className="mt-3 w-full rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            onClick={() => doCopy("website", snippet)}
          >
            {copied === "website" ? "Copied!" : "Copy snippet"}
          </button>
        </div>

        {/* Shopify */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="font-semibold">Shopify</div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
            <li>Online Store → Themes</li>
            <li>… → Edit code</li>
            <li>Open <b>theme.liquid</b></li>
            <li>Paste before <code className="text-xs">&lt;/body&gt;</code></li>
          </ol>

          <pre className="mt-3 max-h-44 overflow-auto rounded-xl bg-gray-50 p-3 text-xs">
            {snippet}
          </pre>

          <button
            className="mt-3 w-full rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            onClick={() => doCopy("shopify", snippet)}
          >
            {copied === "shopify" ? "Copied!" : "Copy Shopify snippet"}
          </button>
        </div>

        {/* No website needed */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="font-semibold">No Website Needed</div>
          <p className="mt-1 text-sm text-gray-600">
            Share your TikoZap Link anywhere (bio link, QR code, Google Business Profile).
          </p>

          <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm">
            {linkUrl}
          </div>

          <button
            className="mt-3 w-full rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            onClick={() => doCopy("link", linkUrl)}
          >
            {copied === "link" ? "Copied!" : "Copy link"}
          </button>

          <div className="mt-3 text-xs text-gray-500">
            Tagline: <span className="font-medium">No Website Needed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/app/widget/embed/page.tsx

"use client";

import StarterLinkAssistant from "@/app/l/[slug]/_components/StarterLinkAssistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function WidgetEmbedPage({
  searchParams,
}: {
  searchParams: {
    key?: string;
    name?: string;
    assistantIdentity?: string;
    brandColor?: string;
    greeting?: string;
  };
}) {
  const publicKey = searchParams.key || "";
  const assistantName = searchParams.name || "Store Assistant";
  const assistantIdentity = searchParams.assistantIdentity || "Female";
  const brandColor = searchParams.brandColor || "#111827";
  const greeting =
    searchParams.greeting ||
    "Hi! I can help with products, order tracking, shipping, and returns.";

  return (
    <div className="tz-widget-embed">
<StarterLinkAssistant
  publicKey={publicKey}
  assistantName={assistantName}
  assistantIdentity={assistantIdentity}
  greeting={greeting}
  premium
  brandColor={brandColor}
  desktopDocked={false}
/>

<style jsx global>{`
  header,
  nav,
  footer,
  .site-header,
  .site-footer,
  .tz-siteHeader,
  .tz-siteFooter {
    display: none !important;
  }

  html,
  body {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    overflow: hidden !important;
  }

  .tz-widget-embed {
    position: fixed;
    inset: 0;

    width: 100%;
    height: 100%;

    margin: 0;
    padding: 0;

    background: transparent;
    overflow: hidden;
  }

  .tz-widget-embed .sl-assistantPanel {
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }

  .tz-widget-embed .sl-assistantHeader {
    position: sticky !important;
    top: 0 !important;
    z-index: 30 !important;
    flex: 0 0 auto !important;
  }

  .tz-widget-embed .sl-assistantMessages {
    flex: 1 1 auto !important;
    min-height: 0 !important;

    overflow-y: auto !important;
    overflow-x: hidden !important;

    overscroll-behavior: contain !important;
    -webkit-overflow-scrolling: touch !important;
    touch-action: pan-y !important;
  }

  .tz-widget-embed .sl-assistantComposer {
    position: relative !important;
    bottom: auto !important;
    z-index: 30 !important;
    flex: 0 0 auto !important;
  }

  /*
   * Mobile iframe:
   * The outer widget.js iframe already controls the visible height.
   */
  @media (max-width: 499px) {
    .tz-widget-embed .sl-assistantPanel {
      position: fixed !important;
      inset: 0 !important;

      width: 100% !important;
      height: 100% !important;

      min-width: 0 !important;
      min-height: 0 !important;
      max-width: none !important;
      max-height: none !important;

      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;

      background: #ffffff !important;
    }
  }

  /*
   * Desktop widget iframe:
   * Its internal width is around 560px, so the shared component
   * otherwise incorrectly activates its mobile breakpoint.
   */
  @media (min-width: 500px) {
    .tz-widget-embed .sl-assistantPanel {
      position: fixed !important;
      inset: 0 !important;

      width: 100% !important;
      height: 100% !important;

      min-width: 0 !important;
      min-height: 0 !important;
      max-width: none !important;
      max-height: none !important;

      border: 1px solid #e5e7eb !important;
      border-radius: 24px !important;

      background: #ffffff !important;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.16) !important;
    }
  }
`}</style>
    </div>
  );
}
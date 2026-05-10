// src/app/widget/embed/page.tsx

"use client";

import StarterLinkAssistant from "@/app/l/[slug]/_components/StarterLinkAssistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function WidgetEmbedPage({
  searchParams,
}: {
  searchParams: { key?: string; name?: string };
}) {
  const publicKey = searchParams.key || "";
  const assistantName = searchParams.name || "Store Assistant";

  return (
    <div className="tz-widget-embed">
      <StarterLinkAssistant
        publicKey={publicKey}
        assistantName={assistantName}
        greeting="Hi! I can help with products, order tracking, shipping, and returns."
        premium
        brandColor="#111827"
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
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    overflow: hidden !important;
  }

  .tz-widget-embed {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  min-height: 100dvh;
  background: transparent;
  overflow: hidden;
}

/* In widget iframe, force assistant panel to behave like full-screen app */
.tz-widget-embed .sl-assistantPanel {
  position: fixed !important;
  left: 0 !important;
  right: 0 !important;
  top: 0 !important;
  bottom: var(--sl-kb, 0px) !important;
  width: 100vw !important;
  height: auto !important;
  max-height: none !important;
  border-radius: 0 !important;
  border: none !important;
  box-shadow: none !important;
}

.tz-widget-embed .sl-assistantComposer {
  position: relative !important;
  bottom: auto !important;
  z-index: 20 !important;
  flex: 0 0 auto !important;
}

.tz-widget-embed .sl-assistantMessages {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overscroll-behavior: contain !important;
}

.tz-widget-embed .sl-assistantPanel {
  overflow: hidden !important;
}

.tz-widget-embed .sl-assistantHeader {
  flex: 0 0 auto !important;
}

.tz-widget-embed .sl-assistantMessages {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overscroll-behavior: contain !important;
  -webkit-overflow-scrolling: touch !important;
}

.tz-widget-embed .sl-assistantComposer {
  position: relative !important;
  bottom: auto !important;
  flex: 0 0 auto !important;
}
`}</style>
    </div>
  );
}
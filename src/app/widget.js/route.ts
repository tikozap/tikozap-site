// src/app/widget.js/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const js = `
(function(){
  var currentScript = document.currentScript;
  var key = currentScript && currentScript.getAttribute("data-tikozap-key");
  var apiBase = currentScript && currentScript.getAttribute("data-tikozap-api-base");

  if (!key) {
    console.warn("[TikoZap] Missing data-tikozap-key");
    return;
  }

  var base = apiBase || window.location.origin;
  var iframe = document.createElement("iframe");

var channel = currentScript && currentScript.getAttribute("data-tikozap-channel");
var subject = currentScript && currentScript.getAttribute("data-tikozap-subject");
var customerName = currentScript && currentScript.getAttribute("data-tikozap-customer-name");
var tags = currentScript && currentScript.getAttribute("data-tikozap-tags");

var params = new URLSearchParams();
params.set("key", key);
if (channel) params.set("channel", channel);
if (subject) params.set("subject", subject);
if (customerName) params.set("customerName", customerName);
if (tags) params.set("tags", tags);

function setIframeSrc(extra) {
  var nextParams = new URLSearchParams(params.toString());

  if (extra && extra.assistantName) {
    nextParams.set("name", extra.assistantName);
  }

  if (extra && extra.greeting) {
    nextParams.set("greeting", extra.greeting);
  }

  if (extra && extra.brandColor) {
    nextParams.set("brandColor", extra.brandColor);
  }

  iframe.src = base + "/widget/embed?" + nextParams.toString();
}

setIframeSrc(null);

fetch(base + "/api/widget/public/settings?key=" + encodeURIComponent(key), {
  cache: "no-store"
})
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    if (!data || !data.ok || !data.widget) return;

    setIframeSrc({
      assistantName: data.widget.assistantName,
      greeting: data.widget.greeting,
      brandColor: data.widget.brandColor
    });
  })
  .catch(function() {});
  iframe.title = "TikoZap Assistant";
  iframe.setAttribute("aria-label", "TikoZap Assistant");
  iframe.setAttribute("allow", "microphone *; camera *; autoplay *");

  var widgetOpen = false;

  iframe.title = "TikoZap Assistant";
  iframe.setAttribute("aria-label", "TikoZap Assistant");
  iframe.setAttribute("allow", "microphone *; camera *; autoplay *");

  iframe.style.position = "fixed";
  iframe.style.border = "0";
  iframe.style.zIndex = "2147483647";
  iframe.style.background = "transparent";
  iframe.style.pointerEvents = "auto";
  iframe.style.boxShadow = "none";
  iframe.style.transition =
    "width 220ms ease, height 220ms ease, box-shadow 220ms ease, border-radius 220ms ease";

  function applyDesktopClosed() {
    iframe.style.left = "auto";
    iframe.style.top = "auto";
    iframe.style.right = "24px";
    iframe.style.bottom = "24px";
    iframe.style.width = "88px";
    iframe.style.height = "88px";
    iframe.style.maxWidth = "88px";
    iframe.style.maxHeight = "88px";
    iframe.style.borderRadius = "999px";
  }

  function applyDesktopOpen() {
    iframe.style.left = "auto";
    iframe.style.top = "auto";
    iframe.style.right = "24px";
    iframe.style.bottom = "24px";
    iframe.style.width = "420px";
    iframe.style.height = "680px";
    iframe.style.maxWidth = "calc(100vw - 32px)";
    iframe.style.maxHeight = "calc(100vh - 32px)";
    iframe.style.borderRadius = "24px";
  }

  function applyMobileClosed() {
    iframe.style.left = "auto";
    iframe.style.top = "auto";
    iframe.style.right = "16px";
    iframe.style.bottom = "16px";
    iframe.style.width = "76px";
    iframe.style.height = "76px";
    iframe.style.maxWidth = "76px";
    iframe.style.maxHeight = "76px";
    iframe.style.borderRadius = "999px";
  }

  function applyMobileOpen() {
    var h =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      screen.height;

    iframe.style.left = "0";
    iframe.style.right = "0";
    iframe.style.top = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "100vw";
    iframe.style.height = h + "px";
    iframe.style.maxWidth = "100vw";
    iframe.style.maxHeight = h + "px";
    iframe.style.borderRadius = "0";
  }

  function syncSize() {
    if (window.innerWidth < 900) {
      if (widgetOpen) {
        applyMobileOpen();
      } else {
        applyMobileClosed();
      }
    } else {
      if (widgetOpen) {
        applyDesktopOpen();
      } else {
        applyDesktopClosed();
      }
    }
  }

  window.addEventListener("resize", syncSize);
  window.addEventListener("orientationchange", syncSize);

  window.addEventListener("message", function(event) {
    if (!event || !event.data || event.data.type !== "TIKOZAP_WIDGET_STATE") {
      return;
    }

    widgetOpen = event.data.open === true;
    syncSize();
  });

  syncSize();
  document.body.appendChild(iframe);
})();
`;

  return new Response(js, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
// src/app/widget.js/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const js = `
(function () {
  var currentScript = document.currentScript;
  var key =
    currentScript &&
    currentScript.getAttribute("data-tikozap-key");

  var apiBase =
    currentScript &&
    currentScript.getAttribute("data-tikozap-api-base");

  if (!key) {
    console.warn("[TikoZap] Missing data-tikozap-key");
    return;
  }

  var base = apiBase || window.location.origin;
  var iframe = document.createElement("iframe");
  var widgetOpen = false;

  var lockedScrollY = 0;
  var pageLocked = false;

  var previousBodyPosition = "";
  var previousBodyTop = "";
  var previousBodyLeft = "";
  var previousBodyRight = "";
  var previousBodyWidth = "";
  var previousBodyOverflow = "";
  var previousHtmlOverflow = "";

  var channel =
    currentScript &&
    currentScript.getAttribute("data-tikozap-channel");

  var subject =
    currentScript &&
    currentScript.getAttribute("data-tikozap-subject");

  var customerName =
    currentScript &&
    currentScript.getAttribute("data-tikozap-customer-name");

  var tags =
    currentScript &&
    currentScript.getAttribute("data-tikozap-tags");

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

    if (extra && extra.assistantIdentity) {
      nextParams.set(
        "assistantIdentity",
        extra.assistantIdentity
      );
    }

    if (extra && extra.greeting) {
      nextParams.set("greeting", extra.greeting);
    }

    if (extra && extra.brandColor) {
      nextParams.set("brandColor", extra.brandColor);
    }

    iframe.src =
      base + "/widget/embed?" + nextParams.toString();
  }

  setIframeSrc(null);

  fetch(
    base +
      "/api/widget/public/settings?key=" +
      encodeURIComponent(key),
    {
      cache: "no-store"
    }
  )
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (!data || !data.ok || !data.widget) return;

      setIframeSrc({
        assistantName: data.widget.assistantName,
        assistantIdentity: data.widget.assistantIdentity,
        greeting: data.widget.greeting,
        brandColor: data.widget.brandColor
      });
    })
    .catch(function () {});

  iframe.title = "TikoZap Assistant";
  iframe.setAttribute(
    "aria-label",
    "TikoZap Assistant"
  );

  iframe.setAttribute(
    "allow",
    "microphone *; camera *; autoplay *"
  );

  iframe.style.position = "fixed";
  iframe.style.border = "0";
  iframe.style.zIndex = "2147483647";
  iframe.style.background = "transparent";
  iframe.style.pointerEvents = "auto";
  iframe.style.boxShadow = "none";

  function enableTransition() {
    iframe.style.transition =
      "width 220ms ease, " +
      "height 220ms ease, " +
      "box-shadow 220ms ease, " +
      "border-radius 220ms ease";
  }

  function lockHostPage() {
    if (pageLocked) return;
    if (window.innerWidth >= 900) return;

    pageLocked = true;
    lockedScrollY =
      window.scrollY ||
      window.pageYOffset ||
      0;

    previousHtmlOverflow =
      document.documentElement.style.overflow;

    previousBodyPosition =
      document.body.style.position;

    previousBodyTop =
      document.body.style.top;

    previousBodyLeft =
      document.body.style.left;

    previousBodyRight =
      document.body.style.right;

    previousBodyWidth =
      document.body.style.width;

    previousBodyOverflow =
      document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";

    document.body.style.position = "fixed";
    document.body.style.top = "-" + lockedScrollY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  }

  function unlockHostPage() {
    if (!pageLocked) return;

    pageLocked = false;

    document.documentElement.style.overflow =
      previousHtmlOverflow;

    document.body.style.position =
      previousBodyPosition;

    document.body.style.top =
      previousBodyTop;

    document.body.style.left =
      previousBodyLeft;

    document.body.style.right =
      previousBodyRight;

    document.body.style.width =
      previousBodyWidth;

    document.body.style.overflow =
      previousBodyOverflow;

    window.scrollTo(0, lockedScrollY);
  }

  function applyDesktopClosed() {
    unlockHostPage();
    enableTransition();

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
    unlockHostPage();
    enableTransition();

    iframe.style.left = "auto";
    iframe.style.top = "auto";
    iframe.style.right = "24px";
    iframe.style.bottom = "24px";

    iframe.style.width = "560px";
    iframe.style.height = "760px";

    iframe.style.maxWidth = "calc(100vw - 32px)";
    iframe.style.maxHeight = "calc(100vh - 32px)";

    iframe.style.borderRadius = "24px";
  }

  function applyMobileClosed() {
    unlockHostPage();
    enableTransition();

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
    lockHostPage();

    var viewport = window.visualViewport;

    var visibleTop = viewport
      ? viewport.offsetTop
      : 0;

    var visibleLeft = viewport
      ? viewport.offsetLeft
      : 0;

    var visibleWidth = viewport
      ? viewport.width
      : window.innerWidth;

    var visibleHeight = viewport
      ? viewport.height
      : window.innerHeight;

    iframe.style.transition = "none";

    iframe.style.left =
      Math.max(0, visibleLeft) + "px";

    iframe.style.top =
      Math.max(0, visibleTop) + "px";

    iframe.style.right = "auto";
    iframe.style.bottom = "auto";

    iframe.style.width =
      Math.max(1, visibleWidth) + "px";

    iframe.style.height =
      Math.max(1, visibleHeight) + "px";

    iframe.style.maxWidth = "none";
    iframe.style.maxHeight = "none";

    iframe.style.borderRadius = "0";
  }

  function syncSize() {
    if (window.innerWidth < 900) {
      if (widgetOpen) {
        applyMobileOpen();
      } else {
        applyMobileClosed();
      }

      return;
    }

    if (widgetOpen) {
      applyDesktopOpen();
    } else {
      applyDesktopClosed();
    }
  }

  window.addEventListener("resize", syncSize);

  window.addEventListener(
    "orientationchange",
    syncSize
  );

  if (window.visualViewport) {
    window.visualViewport.addEventListener(
      "resize",
      syncSize
    );

    window.visualViewport.addEventListener(
      "scroll",
      syncSize
    );
  }

  window.addEventListener(
    "message",
    function (event) {
      if (
        !event ||
        !event.data ||
        event.data.type !==
          "TIKOZAP_WIDGET_STATE"
      ) {
        return;
      }

      widgetOpen =
        event.data.open === true;

      syncSize();
    }
  );

  window.addEventListener(
    "pagehide",
    unlockHostPage
  );

  syncSize();
  document.body.appendChild(iframe);
})();
`;

  return new Response(js, {
    headers: {
      "content-type":
        "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hostNoPort(req: NextRequest) {
  return (req.headers.get("host") || "").split(":")[0].toLowerCase();
}

function isAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname === "/favicon.ico"
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export default function middleware(req: NextRequest) {
  const host = hostNoPort(req);
  const url = req.nextUrl.clone();
  const p = url.pathname;

  // Always allow framework/static assets
  if (isAsset(p)) return NextResponse.next();

  // Always allow API everywhere (critical)
  if (p.startsWith("/api")) return NextResponse.next();

  // ✅ Always allow the widget loader everywhere (critical)
  if (p === "/widget.js") return NextResponse.next();

  // Your app structure
  const DASH_HOME = "/dashboard";
  const LINK_HOME = "/l";

  // -------------------------
  // js.tikozap.com → widget loader only
  // -------------------------
  if (host === "js.tikozap.com") {
    // Only serve /widget.js on this subdomain
    url.hostname = "tikozap.com";
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // -------------------------
  // api.tikozap.com → API only
  // -------------------------
  if (host === "api.tikozap.com") {
    // We already allowed /api/* above.
    // Anything else should go to marketing root.
    url.hostname = "tikozap.com";
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // -------------------------
  // app.tikozap.com → dashboard
  // -------------------------
  if (host === "app.tikozap.com") {
    // Redirect root to dashboard
    if (p === "/") {
      url.pathname = DASH_HOME;
      return NextResponse.redirect(url);
    }

    // Allow dashboard + logout + onboarding only
    const allowed =
      p.startsWith("/dashboard") ||
      p.startsWith("/logout") ||
      p.startsWith("/onboarding");

    if (!allowed) {
      url.pathname = DASH_HOME;
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // -------------------------
  // link.tikozap.com → hosted pages
  // -------------------------
  if (host === "link.tikozap.com") {
    if (p === "/") {
      url.pathname = LINK_HOME;
      return NextResponse.redirect(url);
    }

    const allowed = p.startsWith("/l");
    if (!allowed) {
      url.pathname = LINK_HOME;
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // -------------------------
  // tikozap.com (and anything else) → allow normally
  // -------------------------
  return NextResponse.next();
}

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

  // Always allow the widget loader everywhere (critical)
  if (p === "/widget.js") return NextResponse.next();

  const DASH_HOME = "/dashboard";
  const LINK_HOME = "/l";

  // -------------------------
  // js.tikozap.com → widget loader only
  // -------------------------
  if (host === "js.tikozap.com") {
    // /widget.js already allowed above. Everything else goes to marketing.
    url.hostname = "tikozap.com";
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // -------------------------
  // api.tikozap.com → API only
  // -------------------------
  if (host === "api.tikozap.com") {
    // /api/* already allowed above. Everything else goes to marketing.
    url.hostname = "tikozap.com";
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // -------------------------
  // app.tikozap.com → dashboard (but MUST allow auth pages!)
  // -------------------------
  if (host === "app.tikozap.com") {
    // Root → dashboard
    if (p === "/") {
      url.pathname = DASH_HOME;
      return NextResponse.redirect(url);
    }

    // ✅ Allow these paths on the app subdomain
    const allowed =
      p === "/demo-login" ||
      p.startsWith("/demo-login/") ||
      p.startsWith("/dashboard") ||
      p.startsWith("/onboarding") ||
      p.startsWith("/logout") ||
      p === "/login" ||
      p.startsWith("/login/") ||
      p === "/signup" ||
      p.startsWith("/signup/") ||
      p === "/forgot" ||
      p.startsWith("/forgot/") ||
      p === "/reset" ||
      p.startsWith("/reset/");

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

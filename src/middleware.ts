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
    pathname.startsWith("/sitemap.xml")
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export default function middleware(req: NextRequest) {
  const host = hostNoPort(req);
  const url = req.nextUrl.clone();
  const p = url.pathname;

  if (isAsset(p)) return NextResponse.next();

  // Allow API everywhere (important)
  if (p.startsWith("/api")) return NextResponse.next();

  // ✅ Your app structure suggests these:
  const DASH_HOME = "/dashboard";
  const LINK_HOME = "/l"; // you have a `l` folder in src/app

  // app.tikozap.com → dashboard
  if (host === "app.tikozap.com") {
    // Redirect root to dashboard
    if (p === "/") {
      url.pathname = DASH_HOME;
      return NextResponse.redirect(url);
    }

    // Optional: keep app subdomain focused (no marketing pages)
    // Allow dashboard + logout + onboarding if you want
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

  // link.tikozap.com → hosted pages
  if (host === "link.tikozap.com") {
    if (p === "/") {
      url.pathname = LINK_HOME;
      return NextResponse.redirect(url);
    }

    // Optional: keep link subdomain focused
    const allowed = p.startsWith("/l");
    if (!allowed) {
      url.pathname = LINK_HOME;
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

// api.tikozap.com → API only
if (host === "api.tikozap.com") {
  // Allow only /api/* paths on the api subdomain
  if (!p.startsWith("/api")) {
    url.hostname = "tikozap.com";
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

  // js.tikozap.com → later you can serve a widget loader script;
  // for now, do nothing special.
  return NextResponse.next();
}

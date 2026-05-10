// src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const path = req.nextUrl.pathname;

  // Do not rewrite assets/files
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path === "/favicon.ico" ||
    path.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|txt|xml|json)$/i)
  ) {
    return NextResponse.next();
  }

  // demo-boutique.link.tikozap.com -> /l/demo-boutique
  const cleanHost = host.split(":")[0];

let subdomain = "";

if (cleanHost.endsWith(".link.tikozap.com")) {
  subdomain = cleanHost.replace(".link.tikozap.com", "");
}

if (cleanHost.endsWith(".link.localhost")) {
  subdomain = cleanHost.replace(".link.localhost", "");
}

if (subdomain && subdomain !== "link") {
  const url = req.nextUrl.clone();
  url.pathname = `/l/${subdomain}`;
  return NextResponse.rewrite(url);
}

    if (subdomain && subdomain !== "link") {
      const url = req.nextUrl.clone();
      url.pathname = `/l/${subdomain}`;
      return NextResponse.rewrite(url);
    }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
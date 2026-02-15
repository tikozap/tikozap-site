// src/components/Nav.tsx
"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "";

  useEffect(() => setOpen(false), [pathname]);

  const { onAppHost, isLocalhost, marketingOrigin, appOrigin } = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        onAppHost: false,
        isLocalhost: false,
        marketingOrigin: "https://tikozap.com",
        appOrigin: "https://app.tikozap.com",
      };
    }

    const hostname = window.location.hostname;
    const origin = window.location.origin;

    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const onAppHost = hostname === "app.tikozap.com";

    // ✅ Local dev: keep everything same-origin
    if (isLocalhost) {
      return { onAppHost: false, isLocalhost: true, marketingOrigin: origin, appOrigin: origin };
    }

    return {
      onAppHost,
      isLocalhost: false,
      marketingOrigin: "https://tikozap.com",
      appOrigin: "https://app.tikozap.com",
    };
  }, []);

  const isActive = (href: string) =>
    pathname === href ? "nav__link nav__link--active" : "nav__link";

  // On app host, marketing links should go to tikozap.com
  const linkHref = (href: string) => (onAppHost ? `${marketingOrigin}${href}` : href);

  // Login link: marketing → app, app → login (same-origin)
  const loginHref = onAppHost ? "/login" : `${appOrigin}/login`;

  // Brand: app host should go back to marketing; local/marketing stays local
  const homeHref = onAppHost ? `${marketingOrigin}/` : "/";

  // If cross-origin, use <a>. If same-origin, use <Link>.
  const Brand = onAppHost ? (
    <a href={homeHref} className="nav__brand" aria-label="TikoZap home">
      <img
        src="/tikozaplogo.svg"
        alt="TikoZap"
        className="nav__logo-img"
        style={{ height: "2rem", width: "auto" }}
      />
      <span className="nav__logo-text" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        TikoZap
      </span>
    </a>
  ) : (
    <Link href={homeHref} className="nav__brand" aria-label="TikoZap home">
      <img
        src="/tikozaplogo.svg"
        alt="TikoZap"
        className="nav__logo-img"
        style={{ height: "2rem", width: "auto" }}
      />
      <span className="nav__logo-text" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        TikoZap
      </span>
    </Link>
  );

  return (
    <header className="nav-shell">
      <nav className="nav">
        <div className="container nav__inner">
          {Brand}

          <div className="nav__links">
            {LINKS.map((item) => {
              const active = pathname === item.href;
              const href = linkHref(item.href);

              return onAppHost ? (
                <a
                  key={item.href}
                  href={href}
                  className={isActive(item.href)}
                  style={{ color: active ? "#111827" : "#6B7280" }}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={href}
                  className={isActive(item.href)}
                  style={{ color: active ? "#111827" : "#6B7280" }}
                >
                  {item.label}
                </Link>
              );
            })}

            {onAppHost ? (
              <Link
                href={loginHref}
                className="nav__login nav__login--desktop"
                style={{ color: "#6B7280" }}
              >
                Log in
              </Link>
            ) : (
              <a href={loginHref} className="nav__login nav__login--desktop" style={{ color: "#6B7280" }}>
                Log in
              </a>
            )}
          </div>

          <div className="nav__right">
            {onAppHost ? (
              <Link href={loginHref} className="nav__login nav__login--mobile" style={{ color: "#6B7280" }}>
                Log in
              </Link>
            ) : (
              <a href={loginHref} className="nav__login nav__login--mobile" style={{ color: "#6B7280" }}>
                Log in
              </a>
            )}

            <button
              type="button"
              className="nav__toggle"
              aria-expanded={open}
              aria-label="Toggle navigation"
              onClick={() => setOpen((v) => !v)}
              style={{ width: 32, height: 32 }}
            >
              <span className="nav__toggle-bar" style={{ width: "0.7rem", height: 2, backgroundColor: "#6B7280" }} />
              <span className="nav__toggle-bar" style={{ width: "0.7rem", height: 2, backgroundColor: "#6B7280" }} />
              <span className="nav__toggle-bar" style={{ width: "0.7rem", height: 2, backgroundColor: "#6B7280" }} />
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div className="nav__overlay" aria-label="Mobile navigation">
          <div className="nav__menu">
            {LINKS.map((item) => {
              const active = pathname === item.href;
              const href = linkHref(item.href);
              return onAppHost ? (
                <a
                  key={item.href}
                  href={href}
                  className="nav__menu-item"
                  style={{ color: active ? "#111827" : "#6B7280" }}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={href}
                  className="nav__menu-item"
                  style={{ color: active ? "#111827" : "#6B7280" }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* keep your existing <style jsx> exactly the same */}
    </header>
  );
}

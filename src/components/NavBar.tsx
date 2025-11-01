"use client";
import { usePathname } from "next/navigation";

function LinkItem({ href, children }:{ href:string; children:React.ReactNode }) {
  const path = usePathname();
  const active = path === href;
  return (
    <a
      href={href}
      className={`hover:underline ${active ? "font-semibold text-slate-900" : "text-slate-700"}`}
    >
      {children}
    </a>
  );
}

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <a href="/" className="flex items-center gap-2 font-bold text-slate-900">TikoZap</a>
        <div className="flex items-center gap-5 text-sm">
          <LinkItem href="/pricing">Pricing</LinkItem>
          <LinkItem href="/support">Support</LinkItem>
          <LinkItem href="/contact">Contact</LinkItem>
          <a href="/signup" className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:opacity-95">
            Start free
          </a>
        </div>
      </nav>
    </header>
  );
}

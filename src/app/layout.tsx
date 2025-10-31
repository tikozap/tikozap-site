// src/app/layout.tsx
import '../styles/globals.css'
import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <header className="border-b">
          <div className="mx-auto max-w-6xl h-14 px-4 flex items-center justify-between">
            {/* Brand: Outline logo from /public + wordmark */}
            <Link href="/" className="group flex items-center gap-2 hover:no-underline">
              <img
                src="/tikozaplogo-outline-current.svg"
                alt="TikoZap logo"
                className="h-7 w-auto"
              />
              <span className="text-xl font-semibold tracking-tight text-slate-800 group-hover:text-slate-900 dark:text-slate-100 dark:group-hover:text-white">
                TikoZap
              </span>
            </Link>

            <nav className="flex items-center gap-8 text-sm text-slate-600 dark:text-slate-300">
              <Link href="/onboarding" className="hover:text-slate-900 dark:hover:text-white">Onboarding</Link>
              <Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white">Pricing</Link>
              <Link href="/support" className="hover:text-slate-900 dark:hover:text-white">Support</Link>
            </nav>
          </div>
        </header>

        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>

        <footer className="border-t">
          <div className="mx-auto max-w-6xl px-4 h-14 flex items-center text-xs text-slate-500">
            © {new Date().getFullYear()} TikoZap. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  )
}

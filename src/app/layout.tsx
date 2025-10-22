import '../styles/globals.css'
import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white">
          <div className="container py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-xl">TikoZap</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/onboarding">Onboarding</Link>
              <Link href="/billing">Pricing</Link>
              <Link href="/support">Support</Link>
            </nav>
          </div>
        </header>
        <main className="container py-8">{children}</main>
        <footer className="container py-10 text-sm text-slate-500">
          <div className="flex items-center justify-between">
            <p>© {new Date().getFullYear()} TikoZap</p>
            <p>Smart. Secure. Simple. 24/7.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}

import NavBar from "@/components/NavBar";

export const metadata = {
  title: "TikoZap — AI Customer Support",
  description: "Simple. Secure. Affordable. 24/7.",
  metadataBase: new URL("https://tikozap.com"),
  alternates: { canonical: "/" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-slate-900">
        <NavBar />
        {children}
        <footer className="mt-16 border-t">
          <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-slate-500">
            © {new Date().getFullYear()} TikoZap · <a href="/privacy" className="underline">Privacy</a> · <a href="/terms" className="underline">Terms</a>
          </div>
        </footer>
      </body>
    </html>
  );
}

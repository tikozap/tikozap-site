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
      </body>
    </html>
  );
}

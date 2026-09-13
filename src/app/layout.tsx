// src/app/layout.tsx

import '@/styles/base.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export const metadata = {
  metadataBase: new URL("https://" + "tikozap.com"),

  title: "TikoZap — AI Customer Service for Online Stores",

  description:
    "TikoZap gives online stores an AI employee that answers customers 24/7, learns the business, works with the team, and improves through coaching.",

  applicationName: "TikoZap",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
// src/app/layout.tsx

import '@/styles/base.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import NativeAppMarker from '@/components/NativeAppMarker';

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
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
      <NativeAppMarker />
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
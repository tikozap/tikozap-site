// src/app/layout.tsx

import '@/styles/base.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export const metadata = { /* … */ };

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
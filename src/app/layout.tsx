import '@/styles/base.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export const metadata = { /* … */ };

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
// src/app/layout.tsx
import '../styles/base.css'
import Nav from '../components/Nav'

export const metadata = {
  title: 'TikoZap – AI Customer Support',
  description: 'Simple. Secure. Affordable. 24/7.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}

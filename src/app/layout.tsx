import '../styles/base.css'

export const metadata = {
  title: 'TikoZap – AI Customer Support',
  description: 'Simple. Secure. Affordable. 24/7.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

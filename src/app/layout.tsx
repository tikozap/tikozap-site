// src/app/layout.tsx
import '@/styles/base.css';

export const metadata = { /* … */ };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

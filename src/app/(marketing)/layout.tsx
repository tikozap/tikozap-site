// src/app/(marketing)/layout.tsx
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import HowItWorksGraphic from '@/components/HowItWorksGraphic';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="marketing-main">{children}</main>
      <Footer />
    </>
  );
}

import '../styles/base.css'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

export const metadata = {
  title: 'TikoZap: Instant AI Support for you store',
  description: 'Easy setup. Affordable pricing. 24/7 on-call.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="has-sticky">
        {/* a11y: keyboard users can skip nav */}
        <a href="#main" className="skip">Skip to content</a>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}

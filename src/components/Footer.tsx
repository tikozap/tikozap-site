export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer__inner stack">
        <div className="cols">
          <section className="stack">
            <h3>TikoZap</h3>
            <p className="small">AI customer support that’s simple, secure, and always on.</p>
            <p className="small">© {year} Ala Moda Innovations LLC. All rights reserved.</p>
          </section>

          <nav className="stack" aria-label="Product">
            <h3>Product</h3>
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
            <a href="/docs">Docs</a>
            <a href="/changelog">Changelog</a>
          </nav>

          <nav className="stack" aria-label="Company">
            <h3>Company</h3>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/careers">Careers</a>
            <a href="/press">Press</a>
          </nav>

          <nav className="stack" aria-label="Legal">
            <h3>Legal</h3>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/security">Security</a>
            <a href="/status">Status</a>
          </nav>
        </div>

        <div className="cluster" style={{ justifyContent: 'space-between' }}>
          <small>Made with ♥ in New York</small>
          <small>v0.1.0</small>
        </div>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <main id="main" className="container stack" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
      <header className="container stack hero" style={{ marginBottom: "1.75rem" }}>
  <h1>Instant AI support for your online store</h1>
  <p className="sub">Easy setup. Affordable pricing. 24/7 on-call.</p>

  <div className="cluster">
    <a className="button" href="/signup">Get Started</a>
    <a className="button-outline" href="/demo">Live Demo</a>
  </div>
</header>


      <section className="grid cols-2">
        <div className="card">Card A</div>
        <div className="card">Card B</div>
      </section>
    </main>
  );
}

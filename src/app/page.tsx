export default function Page() {
  return (
    <main className="container stack" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
      <header className="stack" style={{ marginBottom: "1.5rem" }}>
        <h1>TikoZap</h1>
        <p className="small">AI customer support that’s simple, secure, and always on.</p>

        {/* Use the new reusable button classes */}
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

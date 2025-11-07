export default function ContactPage() {
  return (
    <main id="main" className="container stack" style={{ padding: "2rem 0" }}>
      <h1>Contact</h1>
      <p className="small">Tell us about your store and what you’d like to automate.</p>
      <form className="stack" style={{ maxWidth: 560 }}>
        <label>Store URL<input className="card" style={{ width:'100%', padding:'.7rem' }} placeholder="https://yourstore.com" /></label>
        <label>Email<input type="email" className="card" style={{ width:'100%', padding:'.7rem' }} placeholder="you@company.com" /></label>
        <label>What can we help with?<textarea className="card" rows={5} style={{ width:'100%', padding:'.7rem' }} placeholder="Briefly describe your goals" /></label>
        <button className="button" type="button">Send</button>
      </form>
    </main>
  );
}

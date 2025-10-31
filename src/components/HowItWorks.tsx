export default function HowItWorks() {
  const items = [
    {
      title: "Trigger",
      desc: "Customer clicks chat or types on a product/checkout page.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H9l-4 4v-4H6a3 3 0 0 1-3-3z"/>
        </svg>
      ),
    },
    {
      title: "TikoZap replies",
      desc: "Understands intent, answers instantly, and learns from chats.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 2a8 8 0 0 1 7.75 6.02A6 6 0 0 1 18 22H8l-4 2l1.33-4A6 6 0 0 1 4 8.02A8 8 0 0 1 12 2z"/>
        </svg>
      ),
    },
    {
      title: "Agent handoff",
      desc: "Complex cases route to a human with full context & transcript.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 3a5 5 0 0 1 5 5v2h1a3 3 0 0 1 3 3v6h-2v-6a1 1 0 0 0-1-1h-1v3H7v-3H6a1 1 0 0 0-1 1v6H3v-6a3 3 0 0 1 3-3h1V8a5 5 0 0 1 5-5z"/>
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
        <p className="mt-1 text-slate-600">
          Paste one snippet · Answers day & night · Hands off when unsure
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {items.map(({ title, desc, icon }, i) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                  {icon}
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  STEP {i + 1}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";
import { useState } from "react";

function Check() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" className="inline-block">
      <path d="M7.6 13.2l-3-3 1.4-1.4 1.6 1.6 5-5L14 6.8l-6.4 6.4z" fill="currentColor" />
    </svg>
  );
}

export default function TikoZapPricingSection() {
  const [annual, setAnnual] = useState(true);
  const mult = annual ? 0.8 : 1; // 20% off annually
  const suffix = annual ? "/mo billed yearly" : "/mo";

  const plans = [
    {
      name: "Starter",
      price: Math.round(19 * mult),
      blurb: "For small stores getting started",
      cta: "Start free trial",
      highlight: false,
      features: [
        "1,000 conversations / mo",
        "1 teammate seat",
        "Order tracking & status",
        "Quick replies & FAQ",
        "24/7 availability",
        "Basic analytics",
      ],
    },
    {
      name: "Pro",
      price: Math.round(49 * mult),
      blurb: "Best for growing e-commerce",
      cta: "Get Pro",
      highlight: true,
      features: [
        "10,000 conversations / mo",
        "3 teammate seats",
        "Returns & exchanges flow",
        "Human handoff to inbox",
        "Shopify / Woo plug-ins",
        "SLA & priority support",
      ],
    },
    {
      name: "Business",
      price: Math.round(129 * mult),
      blurb: "Advanced control & scale",
      cta: "Talk to sales",
      highlight: false,
      features: [
        "Unlimited conversations",
        "Unlimited seats",
        "Custom workflows & APIs",
        "SSO / SAML",
        "Audit logs & RBAC",
        "Dedicated success manager",
      ],
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      {/* Pricing header + toggle */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Pricing</h3>
          <p className="text-slate-600">Start free. Upgrade when you scale.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-sm ${annual ? "text-slate-900 font-semibold" : "text-slate-500"}`}>
            Annual <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Save 20%</span>
          </span>
          <button
            type="button"
            aria-label="Toggle billing interval"
            onClick={() => setAnnual(!annual)}
            className="relative h-7 w-12 rounded-full border border-slate-300 bg-white transition"
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-indigo-600 transition ${
                annual ? "left-0.5" : "left-5"
              }`}
            />
          </button>
          <span className={`text-sm ${!annual ? "text-slate-900 font-semibold" : "text-slate-500"}`}>Monthly</span>
        </div>
      </div>

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl border p-6 ${
              p.highlight
                ? "border-indigo-200 bg-indigo-50 shadow-[0_8px_30px_rgba(31,41,55,0.08)]"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <h4 className="text-lg font-bold text-slate-900">{p.name}</h4>
              {p.highlight && (
                <span className="rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  Most popular
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-600">{p.blurb}</p>

            <div className="mt-4 flex items-end gap-1">
              <span className="text-3xl font-extrabold text-slate-900">${p.price}</span>
              <span className="pb-1 text-sm text-slate-500">{suffix}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">14-day free trial • Cancel anytime</p>

            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1 text-emerald-600"><Check /></span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <a
                href={p.name === "Business" ? "/contact" : "/signup"}
                className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  p.highlight
                    ? "bg-indigo-600 text-white hover:opacity-95"
                    : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                }`}
              >
                {p.cta}
              </a>
            </div>

            <p className="mt-3 text-xs text-slate-500">Encrypted • Privacy-first • 24/7 support</p>
          </div>
        ))}
      </div>
    </section>
  );
}

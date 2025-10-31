import Image from "next/image";
import HowItWorks from "@/components/HowItWorks";
import TikoZapPricingSection from "@/components/TikoZapPricingSection";

/** Improved single-image hero */
function HeroA() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
        {/* Left copy */}
        <div className="max-w-prose">
          <h1 className="text-5xl font-extrabold text-slate-900 sm:text-6xl">
            TikoZap: AI Customer Support
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Simple. Secure. Affordable.
            <span className="ml-2 align-middle rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold text-slate-700">
              24/7
            </span>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-md hover:opacity-95" href="/signup">
              Start free trial
            </a>
            <a className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-900 hover:bg-slate-50" href="#how-it-works">
              How it works
            </a>
          </div>
          <p className="mt-3 text-sm text-slate-500">Encrypted • Privacy-first</p>
        </div>

        {/* Right visual */}
        <div className="relative">
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
            <Image
              src="/art/hero-gadgets.svg"  // switch to .webp later if you want
              alt="TikoZap chat widget on a product page showing order tracking"
              width={1408}
              height={880}
              priority
              className="rounded-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main>
      <HeroA />
      <HowItWorks />
      <TikoZapPricingSection />
    </main>
  );
}

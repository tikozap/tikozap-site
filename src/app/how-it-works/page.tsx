import type { Metadata } from "next";
import HowItWorksOptionB from "../../components/HowItWorksOptionB";

export const metadata: Metadata = {
  title: "How TikoZap Works | AI Store Employee",
  description:
    "Learn how TikoZap becomes an AI employee for your store, supports customers, works with your team, and improves through coaching.",
};

export default function Page() {
  return (
    <main className="px-6 py-12">
      <header className="mx-auto max-w-3xl text-center mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          How TikoZap works
        </h1>
        <p className="mt-3 text-gray-600">
          Install in a minute. Each conversation runs safely with citations and guardrails.
        </p>
      </header>
      <HowItWorksOptionB />
    </main>
  );
}

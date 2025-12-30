import HowItWorksOptionB from '@/components/HowItWorksOptionB';

export default function Page() {
  return (
    <main className="px-6 py-12">
      <header className="mx-auto max-w-3xl text-center mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">How TikoZap works</h1>
        <p className="mt-3 text-gray-600">
          Install in a minute. Each conversation runs safely with citations and guardrails.
        </p>
      </header>
      <HowItWorksOptionB />
    </main>
  );
}

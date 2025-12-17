import OnboardingNav from '../_components/OnboardingNav';

export default function InstallStep() {
  const snippet = `<script>
  window.TIKOZAP_TENANT = "three-tree-fashion";
</script>
<script async src="https://cdn.tikozap.com/widget.js"></script>`;

  return (
    <div>
      <h2 className="text-lg font-semibold">Install the widget</h2>
      <p className="mt-1 text-sm opacity-80">
        Copy this snippet into your store site (usually before <code>&lt;/body&gt;</code>).
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Allowed domains (security)</span>
          <input
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="localhost, threetreefashion.com"
            defaultValue="localhost"
          />
        </label>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm font-semibold">Install snippet</div>
          <pre className="mt-3 overflow-auto rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed">
{snippet}
          </pre>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" /> I installed the snippet (for testing, you can pretend)
        </label>
      </div>

      <OnboardingNav backHref="/onboarding/widget" nextHref="/onboarding/test" nextLabel="Next: Test it" />
    </div>
  );
}

// src/components/RevenueImpactCard.tsx

type Props = {
  currency?: string;
  baselineRevenue: number;
  conservativeGain: number;
  expectedGain: number;
  strongGain: number;
  onShowBreakdown?: () => void;
  onActivate?: () => void;
};

function fmt(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function RevenueImpactCard({
  currency = "USD",
  baselineRevenue,
  conservativeGain,
  expectedGain,
  strongGain,
  onShowBreakdown,
  onActivate,
}: Props) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-black/60">
        Estimated Monthly Revenue Impact
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-black/60">Current monthly revenue</span>
          <span className="font-semibold">{fmt(baselineRevenue, currency)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-black/60">Estimated gain with Tiko</span>
          <span className="font-semibold">
            {fmt(conservativeGain, currency)} – {fmt(strongGain, currency)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-black/60">Expected midpoint</span>
          <span className="font-semibold">{fmt(expectedGain, currency)}</span>
        </div>

        <div className="pt-2 text-xs text-black/50">
          Based on recent store performance. Estimate only, not a guarantee.
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onActivate}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Activate on my store
        </button>
        <button
          type="button"
          onClick={onShowBreakdown}
          className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-black"
        >
          Show calculation
        </button>
      </div>
    </div>
  );
}
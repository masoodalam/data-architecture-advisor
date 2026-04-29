import { calculateProjectCost, formatUsd } from "../../logic/awsPricing";
import type { AwsInfraNode, CostBreakdown } from "../../types/awsCost";

const categories: Array<keyof CostBreakdown> = ["Compute", "Database", "Storage", "Network"];

export function CostSummary({ nodes }: { nodes: AwsInfraNode[] }) {
  const projectCost = calculateProjectCost(nodes);

  return (
    <section className="rounded-md border border-slate-200 bg-ink p-4 text-white shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">Live monthly estimate</p>
      <p className="mt-2 text-4xl font-bold">{formatUsd(projectCost.total)}</p>
      <div className="mt-4 space-y-2">
        {categories.map((category) => (
          <div key={category} className="flex items-center justify-between rounded-md bg-white/10 px-3 py-2 text-sm">
            <span className="text-slate-200">{category}</span>
            <span className="font-bold">{formatUsd(projectCost.breakdown[category])}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

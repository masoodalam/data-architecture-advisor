import type { RiskItem } from "../types";

const severityClass: Record<RiskItem["severity"], string> = {
  Low: "bg-emerald-100 text-emerald-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-orange-100 text-orange-800",
  Critical: "bg-rose-100 text-rose-800",
};

export function RiskHeatmap({ risks }: { risks: RiskItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-3 pr-4">Area</th>
            <th className="py-3 pr-4">Likelihood</th>
            <th className="py-3 pr-4">Impact</th>
            <th className="py-3 pr-4">Severity</th>
            <th className="py-3">Response</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {risks.map((risk) => (
            <tr key={risk.area}>
              <td className="py-3 pr-4 font-semibold text-ink">{risk.area}</td>
              <td className="py-3 pr-4">{risk.likelihood}/5</td>
              <td className="py-3 pr-4">{risk.impact}/5</td>
              <td className="py-3 pr-4">
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${severityClass[risk.severity]}`}>{risk.severity}</span>
              </td>
              <td className="py-3 text-slate-600">{risk.recommendation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

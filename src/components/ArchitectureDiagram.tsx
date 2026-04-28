import { ArrowRight } from "lucide-react";
import { buildArchitectureLayers } from "../logic/reportBuilder";
import type { AssessmentResult } from "../types";

export function ArchitectureDiagram({ result }: { result: AssessmentResult }) {
  const layers = buildArchitectureLayers(result);
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ArchitectureFlow title="Current architecture" items={layers.current} tone="muted" />
      <ArchitectureFlow title="Target architecture" items={layers.target} tone="target" />
    </div>
  );
}

function ArchitectureFlow({ title, items, tone }: { title: string; items: string[]; tone: "muted" | "target" }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <div className="mt-4 flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={item} className="flex items-center gap-2">
            <div className={`flex-1 rounded-md border px-3 py-3 text-sm font-semibold ${tone === "target" ? "border-teal/30 bg-teal/10 text-teal" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              {item}
            </div>
            {index < items.length - 1 && <ArrowRight className="h-4 w-4 flex-none text-slate-400" />}
          </div>
        ))}
      </div>
    </div>
  );
}

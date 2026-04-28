import { questionBank } from "../data/questionBank";

interface ProgressIndicatorProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function ProgressIndicator({ currentStep, onStepClick }: ProgressIndicatorProps) {
  const percent = Math.round(((currentStep + 1) / questionBank.length) * 100);

  return (
    <aside className="sticky top-6 hidden max-h-[calc(100vh-3rem)] overflow-auto rounded-md border border-slate-200 bg-white p-4 shadow-panel lg:block">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assessment progress</p>
        <div className="mt-2 h-2 rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-teal transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm font-semibold text-ink">{percent}% complete</p>
      </div>
      <nav className="space-y-1">
        {questionBank.map((section, index) => (
          <button
            key={section.id}
            onClick={() => onStepClick(index)}
            className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
              index === currentStep ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="mr-2 text-xs opacity-70">{String(index + 1).padStart(2, "0")}</span>
            {section.shortTitle}
          </button>
        ))}
      </nav>
    </aside>
  );
}

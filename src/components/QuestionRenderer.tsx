import type { Answers, Question } from "../types";

interface QuestionRendererProps {
  question: Question;
  answers: Answers;
  onChange: (id: string, value: string | string[]) => void;
}

export function QuestionRenderer({ question, answers, onChange }: QuestionRendererProps) {
  const value = answers[question.id] ?? "";

  if (question.type === "text") {
    return (
      <label className="block rounded-md border border-slate-200 bg-white p-4">
        <span className="block text-sm font-semibold text-ink">{question.prompt}</span>
        {question.helper && <span className="mt-1 block text-sm text-slate-500">{question.helper}</span>}
        <textarea
          value={String(value)}
          onChange={(event) => onChange(question.id, event.target.value)}
          rows={3}
          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal/20 focus:ring-4"
          placeholder="Capture context, constraints, risks, or current practice"
        />
      </label>
    );
  }

  if (question.type === "multi") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-ink">{question.prompt}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {question.options?.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <label key={option.value} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${checked ? "border-teal bg-teal/10 text-ink" : "border-slate-200 text-slate-600"}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const next = event.target.checked ? [...selected, option.value] : selected.filter((item) => item !== option.value);
                    onChange(question.id, next);
                  }}
                  className="h-4 w-4 accent-teal"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "select") {
    return (
      <label className="block rounded-md border border-slate-200 bg-white p-4">
        <span className="block text-sm font-semibold text-ink">{question.prompt}</span>
        <select
          value={String(value)}
          onChange={(event) => onChange(question.id, event.target.value)}
          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal/20 focus:ring-4"
        >
          <option value="">Select an option</option>
          {question.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-ink">{question.prompt}</p>
      {question.helper && <p className="mt-1 text-sm text-slate-500">{question.helper}</p>}
      <div className="mt-3 grid gap-2 md:grid-cols-5">
        {question.options?.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(question.id, option.value)}
            className={`rounded-md border px-3 py-3 text-left text-sm transition ${
              String(value) === option.value ? "border-teal bg-teal text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="block text-lg font-bold">{option.score}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

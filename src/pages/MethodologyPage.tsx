import { ArrowLeft, BarChart3, CheckCircle2, Layers3, ShieldCheck } from "lucide-react";
import { Button } from "../components/Button";

export function MethodologyPage({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  return (
    <main className="min-h-screen bg-mist">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Data Architecture Advisor</p>
            <h1 className="text-xl font-bold text-ink">Assessment methodology</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" /> Main page
            </Button>
            <Button onClick={onStart}>Start assessment</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="rounded-md bg-ink p-8 text-white shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">How the assessment works</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-bold">A practical 1-5 maturity model for enterprise data architecture</h2>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-200">
            The tool evaluates current-state maturity across architecture, governance, metadata, quality, security, cost, lifecycle, operating model, delivery, AI readiness, and cloud portability. It then turns gaps into a consulting-style report and roadmap.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            [Layers3, "24 sections", "Coverage spans organisation context through AWS adoption readiness."],
            [BarChart3, "19 dimensions", "Scores are grouped into practical maturity domains for the report."],
            [ShieldCheck, "Risk view", "Low maturity areas become likelihood and impact risks."],
            [CheckCircle2, "Action plan", "Recommendations map gaps to tools, controls, and roadmap phases."],
          ].map(([Icon, title, copy]) => {
            const LucideIcon = Icon as typeof Layers3;
            return (
              <article key={String(title)} className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
                <LucideIcon className="h-6 w-6 text-teal" />
                <h3 className="mt-4 text-lg font-bold text-ink">{String(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{String(copy)}</p>
              </article>
            );
          })}
        </div>

        <section className="mt-8 rounded-md border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-2xl font-bold text-ink">Scoring scale</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Score</th>
                  <th className="py-3 pr-4">Level</th>
                  <th className="py-3">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["1", "Not in place", "Capability is absent, manual, undocumented, or dependent on individual effort."],
                  ["2", "Informal", "Some practice exists, but adoption is inconsistent and hard to repeat."],
                  ["3", "Defined", "Practice is documented and used for key datasets, pipelines, or teams."],
                  ["4", "Standardised", "Practice is measured, governed, and embedded in normal delivery."],
                  ["5", "Optimised", "Capability is automated, continuously improved, and widely adopted."],
                ].map(([score, level, meaning]) => (
                  <tr key={score}>
                    <td className="py-3 pr-4 text-lg font-bold text-teal">{score}</td>
                    <td className="py-3 pr-4 font-semibold text-ink">{level}</td>
                    <td className="py-3 text-slate-600">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-md border border-slate-200 bg-white p-6 shadow-panel">
            <h2 className="text-2xl font-bold text-ink">Maturity classification</h2>
            <div className="mt-5 space-y-3 text-sm">
              {[
                ["1.0 to 1.9", "Ad hoc"],
                ["2.0 to 2.9", "Developing"],
                ["3.0 to 3.9", "Managed"],
                ["4.0 to 4.5", "Advanced"],
                ["4.6 to 5.0", "Optimised"],
              ].map(([range, label]) => (
                <div key={range} className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
                  <span className="font-semibold text-slate-600">{range}</span>
                  <span className="font-bold text-ink">{label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-md border border-slate-200 bg-white p-6 shadow-panel">
            <h2 className="text-2xl font-bold text-ink">Recommendation modes</h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <p><strong className="text-ink">Open source heavy:</strong> prioritises DataHub, Great Expectations, MetaWorks, Airbyte, dbt, Airflow, Superset or Metabase, ClickHouse, Prometheus, and Grafana.</p>
              <p><strong className="text-ink">Hybrid:</strong> combines AWS managed services with portable metadata, quality, standards, transformation, and BI layers.</p>
              <p><strong className="text-ink">AWS managed:</strong> anchors target architecture on Amazon S3, Redshift, Glue, Lambda, Step Functions, Kinesis, and AWS-native operations.</p>
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-md border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-2xl font-bold text-ink">Report outputs</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "Executive summary and overall maturity score",
              "Radar chart and domain score bar chart",
              "Risk heatmap based on likelihood and impact",
              "Current vs target architecture diagram",
              "Open source vs AWS recommendation comparison",
              "Governance, metadata, quality, lifecycle, ownership, and CI/CD recommendations",
              "SLA, freshness, ML/AI readiness, portability, and cost optimisation sections",
              "Priority action matrix and three-phase roadmap",
            ].map((item) => (
              <div key={item} className="rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

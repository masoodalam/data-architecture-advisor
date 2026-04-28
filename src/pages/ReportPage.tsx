import { ArrowLeft, Printer, RotateCcw } from "lucide-react";
import { ArchitectureDiagram } from "../components/ArchitectureDiagram";
import { Button } from "../components/Button";
import { CostComplexityChart, DomainBarChart, MaturityRadar, PriorityMatrix } from "../components/Charts";
import { RiskHeatmap } from "../components/RiskHeatmap";
import { comparisonRows, buildExecutiveSummary, modeSummary } from "../logic/reportBuilder";
import type { Answers, AssessmentResult } from "../types";

interface ReportPageProps {
  answers: Answers;
  result: AssessmentResult;
  onBack: () => void;
  onRestart: () => void;
}

export function ReportPage({ answers, result, onBack, onRestart }: ReportPageProps) {
  const summary = buildExecutiveSummary(result, answers);
  const lowDomains = result.dimensionScores.filter((score) => score.score < 3).slice(0, 4);

  return (
    <main className="min-h-screen bg-mist print:bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur print:static">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Data Architecture Advisor</p>
            <h1 className="text-xl font-bold text-ink">Assessment report</h1>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Assessment</Button>
            <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print/export</Button>
            <Button variant="ghost" onClick={onRestart}><RotateCcw className="h-4 w-4" /> Restart</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <section className="rounded-md bg-ink p-8 text-white print:bg-white print:text-ink">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-200 print:text-teal">Executive summary</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_220px]">
            <div>
              <h2 className="text-4xl font-bold">Data architecture maturity: {result.classification}</h2>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-200 print:text-slate-700">{summary}</p>
            </div>
            <div className="rounded-md border border-white/15 bg-white/10 p-5 text-center print:border-slate-200 print:bg-slate-50">
              <p className="text-sm uppercase tracking-wide text-slate-300 print:text-slate-500">Overall score</p>
              <p className="mt-2 text-6xl font-bold">{result.overallScore.toFixed(1)}</p>
              <p className="text-sm text-slate-300 print:text-slate-500">out of 5.0</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-3">
          {modeSummary(result).map((item) => (
            <article key={item} className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
              <p className="text-sm leading-6 text-slate-700">{item}</p>
            </article>
          ))}
          <article className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
            <p className="text-sm font-semibold text-ink">Key gaps</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {lowDomains.length ? lowDomains.map((score) => `${score.label} (${score.score.toFixed(1)})`).join(", ") : "No domains below 3.0. Focus on optimisation and resilience."}
            </p>
          </article>
        </section>

        <ReportSection title="Maturity analytics">
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
              <h3 className="text-lg font-bold text-ink">Radar chart</h3>
              <MaturityRadar result={result} />
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
              <h3 className="text-lg font-bold text-ink">Domain scores</h3>
              <DomainBarChart result={result} />
            </div>
          </div>
        </ReportSection>

        <ReportSection title="Risk heatmap">
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
            <RiskHeatmap risks={result.risks} />
          </div>
        </ReportSection>

        <ReportSection title="Current vs target architecture">
          <ArchitectureDiagram result={result} />
        </ReportSection>

        <ReportSection title="Open source vs AWS recommendation comparison">
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-panel">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Open source</th>
                  <th className="px-4 py-3">AWS managed</th>
                  <th className="px-4 py-3">Recommended fit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonRows(result).map((row) => (
                  <tr key={row.area}>
                    <td className="px-4 py-3 font-semibold text-ink">{row.area}</td>
                    <td className="px-4 py-3 text-slate-600">{row.open}</td>
                    <td className="px-4 py-3 text-slate-600">{row.aws}</td>
                    <td className="px-4 py-3 text-slate-600">{row.fit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>

        <ReportSection title="Focused recommendations">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {result.recommendations.map((rec) => (
              <article key={rec.area} className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-ink">{rec.area}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{rec.priority}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{rec.summary}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {rec.actions.map((action) => <li key={action}>- {action}</li>)}
                </ul>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Tools</p>
                <p className="mt-1 text-sm font-semibold text-teal">{rec.tools.join(", ")}</p>
              </article>
            ))}
          </div>
        </ReportSection>

        <ReportSection title="Roadmap and priority matrix">
          <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
              <h3 className="text-lg font-bold text-ink">3-phase roadmap</h3>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {[
                  ["Phase 1", "Quick wins", "Launch DataHub foundations, Great Expectations checks for critical datasets, MetaWorks standards, risk heatmap remediation, and owner assignments."],
                  ["Phase 2", "Stabilisation", "Standardise ingestion, storage layers, CI/CD, environment separation, lineage capture, SLA monitoring, and security evidence."],
                  ["Phase 3", "Scale and optimise", "Optimise cost, automate lifecycle controls, mature data contracts, expand AI-ready data products, and reduce portability risk."],
                ].map(([phase, title, copy]) => (
                  <div key={phase} className="rounded-md border border-slate-200 p-4">
                    <p className="text-sm font-semibold uppercase tracking-wide text-teal">{phase}</p>
                    <h4 className="mt-2 text-lg font-bold text-ink">{title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
              <h3 className="text-lg font-bold text-ink">Priority action matrix</h3>
              <PriorityMatrix result={result} />
            </div>
          </div>
        </ReportSection>

        <ReportSection title="Cost vs complexity">
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
            <CostComplexityChart />
          </div>
        </ReportSection>
      </div>
    </main>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 break-inside-avoid">
      <h2 className="mb-4 text-2xl font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

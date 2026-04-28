import { ArrowRight, BarChart3, FileText, ShieldCheck } from "lucide-react";
import { Button } from "../components/Button";

export function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <main className="min-h-screen bg-mist">
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">Enterprise assessment tool</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-bold leading-tight md:text-7xl">Data Architecture Advisor</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Assess data architecture maturity across ingestion, storage, metadata, governance, quality, security, cost, operating model, AI readiness, and AWS adoption. Produce a practical consulting-grade roadmap in the browser.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={onStart} className="bg-white text-ink hover:bg-slate-100">
                Start assessment <ArrowRight className="h-4 w-4" />
              </Button>
              <a href="#method" className="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
                View methodology
              </a>
            </div>
          </div>
          <div className="grid content-end gap-3">
            {[
              ["24", "assessment sections"],
              ["19", "maturity dimensions"],
              ["3", "architecture modes"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-md border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-4xl font-bold">{value}</p>
                <p className="mt-1 text-sm uppercase tracking-wide text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="method" className="mx-auto grid max-w-7xl gap-5 px-6 py-10 md:grid-cols-3 lg:px-8">
        {[
          [BarChart3, "Maturity scoring", "Score each capability from 1 to 5, classify the overall maturity, and compare current state to target state."],
          [ShieldCheck, "Actionable recommendations", "Map gaps to DataHub, Great Expectations, MetaWorks, AWS managed services, and portable open source options."],
          [FileText, "Consulting report", "Generate charts, risk heatmap, architecture diagrams, priority matrix, and a three-phase roadmap with print export."],
        ].map(([Icon, title, copy]) => {
          const LucideIcon = Icon as typeof BarChart3;
          return (
            <article key={String(title)} className="rounded-md border border-slate-200 bg-white p-6 shadow-panel">
              <LucideIcon className="h-6 w-6 text-teal" />
              <h2 className="mt-4 text-lg font-bold text-ink">{String(title)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{String(copy)}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}

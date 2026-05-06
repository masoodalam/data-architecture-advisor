import { ArrowRight, BarChart3, Calculator, FileText, ShieldCheck } from "lucide-react";
import { Button } from "../components/Button";

// Scotland Saltire flag as inline SVG
function ScotlandFlag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-label="Scotland flag">
      <rect width="60" height="40" fill="#003399" />
      <line x1="0" y1="0" x2="60" y2="40" stroke="white" strokeWidth="8" />
      <line x1="60" y1="0" x2="0" y2="40" stroke="white" strokeWidth="8" />
      <line x1="0" y1="0" x2="60" y2="40" stroke="#003399" strokeWidth="2" />
      <line x1="60" y1="0" x2="0" y2="40" stroke="#003399" strokeWidth="2" />
    </svg>
  );
}

export function LandingPage({
  onStart,
  onTraditional,
  onMethodology,
  onAwsCostDesigner,
}: {
  onStart: () => void;
  onTraditional: () => void;
  onMethodology: () => void;
  onAwsCostDesigner: () => void;
}) {
  return (
    <main className="min-h-screen bg-sg-surface">

      {/* ── Top nav bar ─────────────────────────────────── */}
      <nav className="bg-sg border-b border-sg-hover">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
          {/* Logo area */}
          <div className="flex items-center gap-3">
            <ScotlandFlag className="h-7 w-10 rounded-sm shadow-sm flex-shrink-0" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 leading-none">Scotland</p>
              <p className="text-sm font-bold text-white leading-tight">Data Architecture Advisor</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <button
              onClick={onMethodology}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              View methodology
            </button>
            <button
              onClick={onAwsCostDesigner}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Calculator className="h-3.5 w-3.5" /> AWS Cost Designer
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-sg text-white">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(90deg,rgba(255,255,255,.3)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.3)_1px,transparent_1px)] [background-size:44px_44px]" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-b from-transparent to-sg-hover/40" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:py-20">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 border border-white/20">
                Enterprise assessment tool
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 border border-white/15">
                TOGAF · DAMA-DMBOK · FAIR
              </span>
            </div>
            <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-6xl">
              Data Architecture<br />
              <span className="text-white/80">Maturity Assessment</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/75">
              Assess data architecture maturity across 19 dimensions — governance, quality, security, lineage, AI readiness, and more.
              Produce a consulting-grade report with AI-powered insights, roadmap, and recommendations.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={onStart}
                className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-sg shadow-lg hover:bg-sg-light transition-colors"
              >
                Start Assessment <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-xs text-white/50">
              AI-powered interview · Claude Opus 4.6 · AWS Bedrock eu-west-2
            </p>
          </div>

          {/* Stats */}
          <div className="grid content-center gap-3">
            {[
              ["19", "maturity dimensions"],
              ["8",  "architecture domains"],
              ["3",  "architecture modes"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm">
                <p className="text-4xl font-bold">{value}</p>
                <p className="mt-0.5 text-sm uppercase tracking-wide text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature cards ───────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [BarChart3,   "Maturity scoring",          "Score each capability from 1–5, classify overall maturity, and compare current state to a 4.2 target across all 19 dimensions."],
            [ShieldCheck, "Actionable recommendations", "Map gaps to DataHub, Great Expectations, dbt, Apache Kafka, and equivalent AWS, Azure, and GCP managed services."],
            [FileText,    "Consulting report",          "AI-generated executive narrative, risk heatmap, architecture diagrams, priority matrix, and a three-phase roadmap."],
          ].map(([Icon, title, copy]) => {
            const LucideIcon = Icon as typeof BarChart3;
            return (
              <article key={String(title)} className="rounded-lg border border-slate-200 bg-white p-6 shadow-card hover:shadow-panel transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sg-light">
                  <LucideIcon className="h-5 w-5 text-sg" />
                </div>
                <h2 className="mt-4 text-base font-bold text-sg-text">{String(title)}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{String(copy)}</p>
              </article>
            );
          })}
        </div>

        {/* Standards bar */}
        <div className="mt-8 rounded-lg border border-sg/20 bg-sg-light px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <ScotlandFlag className="h-5 w-7 rounded-sm flex-shrink-0" />
          <span className="text-xs text-sg-text font-semibold">Standards aligned:</span>
          {["DCAT-AP 3", "FAIR Principles", "TOGAF 9.2", "DAMA-DMBOK 2", "UK GDS", "Cyber Essentials", "ISO 27001"].map(s => (
            <span key={s} className="text-xs text-sg font-semibold">· {s}</span>
          ))}
        </div>
      </section>
    </main>
  );
}

import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, FileText, FileType2, Info, Upload, X, Zap } from "lucide-react";
import { type ReactElement, useCallback, useRef, useState } from "react";
import {
  type ClarifyingQuestion,
  type GapAnalysis,
  type GapItem,
  analyseArchitecture,
  refineAnalysis,
  streamGapReport,
} from "../services/gapService";

type Phase = "upload" | "analysing" | "review" | "generating" | "report";

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);
const ACCEPTED_TYPES = 'image/png,image/jpeg,image/jpg,image/gif,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword';

function fileTypeLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'Word Document';
  if (mimeType === 'application/msword') return 'Word Document';
  return 'Image';
}

function isImageType(mimeType: string): boolean {
  return IMAGE_TYPES.has(mimeType);
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "bg-red-50 border-red-300 text-red-800",
  high:     "bg-orange-50 border-orange-300 text-orange-800",
  medium:   "bg-yellow-50 border-yellow-300 text-yellow-800",
  low:      "bg-green-50 border-green-300 text-green-800",
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border border-red-200",
  high:     "bg-orange-100 text-orange-700 border border-orange-200",
  medium:   "bg-yellow-100 text-yellow-700 border border-yellow-200",
  low:      "bg-green-100 text-green-700 border border-green-200",
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-yellow-500",
  low:      "bg-green-500",
};

function ScoreBar({ value, max = 100, color = "bg-sg" }: { value: number; max?: number; color?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100">
      <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const color = score >= 4 ? "bg-green-100 text-green-700" : score >= 3 ? "bg-yellow-100 text-yellow-700" : score >= 2 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700";
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold ${color}`}>{score.toFixed(1)}</span>;
}

function GapCard({ gap }: { gap: GapItem }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article
      className={`rounded-lg border p-3 cursor-pointer transition-shadow hover:shadow-card ${SEVERITY_COLOR[gap.severity]}`}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-0.5 ${SEVERITY_DOT[gap.severity]}`} />
          <span className="text-xs font-bold truncate">{gap.label}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <ScorePill score={gap.score} />
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SEVERITY_BADGE[gap.severity]}`}>
            {gap.severity}
          </span>
          <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>
      {expanded && (
        <div className="mt-2 space-y-1.5 text-xs">
          <p className="leading-relaxed">{gap.finding}</p>
          <p className="font-semibold">Recommendation: <span className="font-normal">{gap.recommendation}</span></p>
          {gap.tools.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {gap.tools.map(t => (
                <span key={t} className="rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-semibold border">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function QuestionWidget({
  q,
  onAnswer,
}: {
  q: ClarifyingQuestion;
  onAnswer: (answer: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState('');

  if (q.type === 'yes_no') {
    return (
      <div className="flex gap-2 mt-3">
        {['Yes', 'No'].map(opt => (
          <button
            key={opt}
            onClick={() => onAnswer(opt)}
            className="flex-1 rounded-lg border-2 border-sg py-2 text-sm font-bold text-sg hover:bg-sg hover:text-white transition-colors"
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (q.type === 'multiple_choice') {
    const toggle = (opt: string) =>
      setSelected(s => s.includes(opt) ? s.filter(x => x !== opt) : [...s, opt]);
    return (
      <div className="mt-3 space-y-1.5">
        {q.options.map(opt => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`w-full rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors ${selected.includes(opt) ? 'border-sg bg-sg-light text-sg font-semibold' : 'border-slate-200 hover:border-sg/50'}`}
          >
            {selected.includes(opt) && <span className="mr-2">✓</span>}{opt}
          </button>
        ))}
        {selected.length > 0 && (
          <button
            onClick={() => onAnswer(selected.join(', '))}
            className="mt-1 w-full rounded-lg bg-sg py-2 text-sm font-bold text-white hover:bg-sg-hover transition-colors"
          >
            Confirm selection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 flex gap-2">
      <input
        className="flex-1 rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-sg focus:outline-none"
        placeholder="Type your answer…"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && text.trim()) { onAnswer(text.trim()); setText(''); } }}
      />
      <button
        disabled={!text.trim()}
        onClick={() => { onAnswer(text.trim()); setText(''); }}
        className="rounded-lg bg-sg px-4 py-2 text-sm font-bold text-white disabled:opacity-40 hover:bg-sg-hover transition-colors"
      >
        Send
      </button>
    </div>
  );
}

function MarkdownReport({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n');
  const elements: ReactElement[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} className="text-2xl font-bold text-sg-text mt-6 mb-3">{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-lg font-bold text-sg mt-5 mb-2 border-b border-slate-100 pb-1">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-base font-bold text-sg-text mt-4 mb-1.5">{line.slice(4)}</h3>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={key++} className="ml-4 text-sm text-slate-700 leading-6 list-disc">{line.slice(2)}</li>);
    } else if (/^\d+\. /.test(line)) {
      elements.push(<li key={key++} className="ml-4 text-sm text-slate-700 leading-6 list-decimal">{line.replace(/^\d+\. /, '')}</li>);
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(<p key={key++} className="text-sm text-slate-700 leading-7">{line}</p>);
    }
  }
  return <div className="space-y-0.5">{elements}</div>;
}

export function GapAnalysisPage({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/png');
  const [context, setContext] = useState('');
  const [analysis, setAnalysis] = useState<GapAnalysis | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<ClarifyingQuestion | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [report, setReport] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback((file: File) => {
    const accepted = ACCEPTED_TYPES.split(',');
    if (!accepted.includes(file.type)) {
      setError('Please upload a PNG, JPG, GIF, WebP image, PDF, or Word document (.docx).');
      return;
    }
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      if (isImageType(file.type)) {
        setImagePreview(dataUrl);
      } else {
        setImagePreview(null);
      }
      setImageBase64(dataUrl.split(',')[1]);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, [loadFile]);

  async function startAnalysis() {
    if (!imageBase64) return;
    setPhase('analysing');
    setError(null);
    try {
      const result = await analyseArchitecture(imageBase64, mimeType, context);
      setAnalysis(result);
      const pending = result.clarifying_questions.filter(q => !q.answered);
      setCurrentQuestion(pending[0] ?? null);
      setPhase('review');
    } catch (err) {
      setError((err as Error).message);
      setPhase('upload');
    }
  }

  async function handleAnswer(answer: string) {
    if (!analysis || !currentQuestion) return;
    setRefining(true);
    try {
      const updated = await refineAnalysis(analysis, currentQuestion.id, currentQuestion.question, answer);
      setAnalysis(updated);
      setAnsweredCount(c => c + 1);
      const pending = updated.clarifying_questions.filter(q => !q.answered);
      setCurrentQuestion(pending[0] ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRefining(false);
    }
  }

  function skipQuestion() {
    if (!analysis) return;
    const pending = analysis.clarifying_questions.filter(q => !q.answered && q.id !== currentQuestion?.id);
    setCurrentQuestion(pending[0] ?? null);
    setAnsweredCount(c => c + 1);
  }

  async function generateReport() {
    if (!analysis) return;
    setPhase('generating');
    setReport('');
    try {
      for await (const chunk of streamGapReport(analysis)) {
        setReport(prev => prev + chunk);
      }
      setPhase('report');
    } catch (err) {
      setError((err as Error).message);
      setPhase('review');
    }
  }

  const criticalGaps = analysis?.gaps.filter(g => g.severity === 'critical') ?? [];
  const highGaps     = analysis?.gaps.filter(g => g.severity === 'high') ?? [];
  const mediumGaps   = analysis?.gaps.filter(g => g.severity === 'medium') ?? [];
  const lowGaps      = analysis?.gaps.filter(g => g.severity === 'low') ?? [];

  return (
    <div className="min-h-screen bg-sg-surface flex flex-col">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <nav className="bg-sg border-b border-sg-hover flex-shrink-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <span className="text-sm font-bold text-white">Architecture Gap Analysis</span>
          </div>
          {analysis && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Report readiness</span>
              <div className="h-1.5 w-24 rounded-full bg-white/20">
                <div
                  className="h-1.5 rounded-full bg-white transition-all"
                  style={{ width: `${analysis.report_readiness}%` }}
                />
              </div>
              <span className="text-xs text-white font-bold">{analysis.report_readiness}%</span>
            </div>
          )}
        </div>
      </nav>

      {/* ── UPLOAD phase ─────────────────────────────────────────────────── */}
      {phase === 'upload' && (
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-sg mb-4">
                <Upload className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-sg-text">Upload Architecture Document</h1>
              <p className="mt-2 text-sm text-slate-500">AI-powered gap analysis across 18 dimensions — aligned to TOGAF, FAIR, DCAT-AP 3, and UK GDS standards</p>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
                dragOver ? 'border-sg bg-sg-light' : 'border-slate-300 hover:border-sg/60 bg-white'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
              />

              {imageBase64 && imagePreview ? (
                <div className="relative p-4">
                  <img src={imagePreview} alt="Architecture diagram preview" className="mx-auto max-h-64 rounded-lg object-contain" />
                  <button
                    onClick={e => { e.stopPropagation(); setImagePreview(null); setImageBase64(null); }}
                    className="absolute top-2 right-2 rounded-full bg-white p-1 shadow-sm hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : imageBase64 && !imagePreview ? (
                <div className="relative p-6 flex items-center gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-xl bg-sg-light border border-sg/20">
                    <FileType2 className="h-7 w-7 text-sg" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-sg-text truncate">{fileTypeLabel(mimeType)} uploaded</p>
                    <p className="text-xs text-slate-500 mt-0.5">Ready to analyse — text will be extracted automatically</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setImagePreview(null); setImageBase64(null); }}
                    className="ml-auto flex-shrink-0 rounded-full bg-white p-1 shadow-sm hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                  <Upload className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-500">Drop your file here or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">Images (PNG, JPG, GIF, WebP) · PDF · Word (.docx) — max 8 MB</p>
                </div>
              )}
            </div>

            {/* Optional context */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Additional context (optional)
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:border-sg focus:outline-none"
                rows={3}
                placeholder="e.g. This is our current AWS data platform serving 5 data teams. We're planning to migrate to a data mesh approach…"
                value={context}
                onChange={e => setContext(e.target.value)}
              />
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {error}
              </div>
            )}

            <button
              onClick={startAnalysis}
              disabled={!imageBase64}
              className="mt-5 w-full rounded-xl bg-sg py-3 text-sm font-bold text-white disabled:opacity-40 hover:bg-sg-hover transition-colors shadow-lg"
            >
              Analyse Architecture
            </button>
          </div>
        </main>
      )}

      {/* ── ANALYSING phase ──────────────────────────────────────────────── */}
      {phase === 'analysing' && (
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center h-20 w-20 mb-6">
              <div className="absolute inset-0 rounded-full bg-sg/10 animate-ping" />
              <div className="relative rounded-full bg-sg/20 p-5">
                <Zap className="h-10 w-10 text-sg animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-sg-text">Analysing your architecture…</h2>
            <p className="mt-2 text-sm text-slate-500">
              {isImageType(mimeType) ? 'Claude Vision is reviewing your diagram' : 'Extracting and analysing document content'} across 18 dimensions
            </p>
            <div className="mt-6 space-y-2 text-xs text-slate-400">
              {[
                isImageType(mimeType) ? 'Parsing diagram elements' : 'Extracting document text',
                'Mapping to TOGAF ADM phases',
                'Assessing FAIR principles',
                'Identifying gaps and risks',
              ].map((step, i) => (
                <div key={step} className="flex items-center justify-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-sg animate-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ── REVIEW phase (3-panel) ───────────────────────────────────────── */}
      {(phase === 'review' || (phase === 'generating' && analysis)) && analysis && (
        <main className="flex-1 flex min-h-0 overflow-hidden">

          {/* Left: diagram + gaps by severity */}
          <aside className="hidden lg:flex w-72 xl:w-80 flex-col border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0">
            <div className="p-4 border-b border-slate-100">
              {imagePreview && (
                <img src={imagePreview} alt="Diagram" className="w-full rounded-lg object-contain max-h-40 bg-slate-50 border border-slate-100" />
              )}
            </div>
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Maturity</span>
                <span className="text-xl font-bold text-sg-text">{analysis.maturity_score.toFixed(1)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-sg transition-all"
                  style={{ width: `${((analysis.maturity_score - 1) / 4) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400">Ad hoc (1)</span>
                <span className="text-[10px] font-semibold text-sg">{analysis.maturity_classification}</span>
                <span className="text-[10px] text-slate-400">Optimised (5)</span>
              </div>
            </div>
            <div className="p-4 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Architecture type</p>
              <span className="rounded-full bg-sg-light text-sg text-xs font-bold px-2.5 py-1">{analysis.architecture_type}</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Gap severity</p>
              {[
                { label: 'Critical', count: criticalGaps.length, color: 'bg-red-500', text: 'text-red-700' },
                { label: 'High',     count: highGaps.length,     color: 'bg-orange-500', text: 'text-orange-700' },
                { label: 'Medium',   count: mediumGaps.length,   color: 'bg-yellow-500', text: 'text-yellow-700' },
                { label: 'Low',      count: lowGaps.length,      color: 'bg-green-500',  text: 'text-green-700' },
              ].map(({ label, count, color, text }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${color}`} />
                  <span className="text-xs text-slate-600 flex-1">{label}</span>
                  <span className={`text-xs font-bold ${text}`}>{count}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Center: gaps list + question */}
          <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* Summary banner */}
            <div className="bg-sg-light border-b border-sg/20 px-5 py-4">
              <p className="text-xs font-semibold text-sg uppercase tracking-wide mb-1">Assessment summary</p>
              <p className="text-sm text-sg-text leading-relaxed">{analysis.summary}</p>
              {analysis.strengths.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {analysis.strengths.slice(0, 3).map(s => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-full bg-white border border-sg/20 px-2 py-0.5 text-[10px] font-semibold text-sg">
                      <CheckCircle2 className="h-2.5 w-2.5" /> {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 p-5 space-y-5">
              {/* Critical + High gaps */}
              {criticalGaps.length + highGaps.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" /> Critical &amp; High Priority Gaps
                  </h2>
                  <div className="space-y-2">
                    {[...criticalGaps, ...highGaps].map(g => <GapCard key={g.category} gap={g} />)}
                  </div>
                </div>
              )}

              {/* Medium gaps */}
              {mediumGaps.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-2">Medium Priority Gaps</h2>
                  <div className="space-y-2">
                    {mediumGaps.map(g => <GapCard key={g.category} gap={g} />)}
                  </div>
                </div>
              )}

              {/* Low / strengths */}
              {lowGaps.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">Strengths</h2>
                  <div className="space-y-2">
                    {lowGaps.map(g => <GapCard key={g.category} gap={g} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Current question */}
            {phase === 'review' && (
              <div className="border-t border-slate-200 bg-white p-5 flex-shrink-0">
                {currentQuestion ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${SEVERITY_BADGE[currentQuestion.priority === 'high' ? 'high' : currentQuestion.priority === 'medium' ? 'medium' : 'low']}`}>
                        {currentQuestion.priority} priority
                      </span>
                      <span className="text-[10px] text-slate-400">{currentQuestion.category} · {answeredCount} of {(analysis.clarifying_questions?.length ?? 0)} answered</span>
                    </div>
                    <p className="text-sm font-semibold text-sg-text">{currentQuestion.question}</p>
                    {refining ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <div className="h-4 w-4 rounded-full border-2 border-sg border-t-transparent animate-spin" />
                        Updating analysis…
                      </div>
                    ) : (
                      <QuestionWidget q={currentQuestion} onAnswer={handleAnswer} />
                    )}
                    <button onClick={skipQuestion} className="mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                      Skip this question
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-sg-success" />
                      <div>
                        <p className="text-sm font-bold text-sg-text">Analysis complete</p>
                        <p className="text-xs text-slate-500">All clarifying questions answered · {analysis.report_readiness}% readiness</p>
                      </div>
                    </div>
                    <button
                      onClick={generateReport}
                      className="flex items-center gap-2 rounded-xl bg-sg px-5 py-2.5 text-sm font-bold text-white hover:bg-sg-hover transition-colors shadow-lg"
                    >
                      <FileText className="h-4 w-4" /> Generate Report
                    </button>
                  </div>
                )}
                {phase === 'review' && currentQuestion && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={generateReport}
                      disabled={analysis.report_readiness < 40}
                      className="flex items-center gap-2 rounded-xl bg-sg px-4 py-2 text-xs font-bold text-white disabled:opacity-30 hover:bg-sg-hover transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {analysis.report_readiness < 40 ? `Generate Report (${analysis.report_readiness}% ready)` : 'Generate Report'}
                    </button>
                  </div>
                )}
                {error && (
                  <div className="mt-2 flex items-center gap-2 rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5" /> {error}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Right: FAIR, standards, metrics */}
          <aside className="hidden xl:flex w-72 flex-col border-l border-slate-200 bg-white overflow-y-auto flex-shrink-0">
            <div className="p-4 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">FAIR Principles</p>
              <div className="space-y-2.5">
                {Object.entries(analysis.fair_scores).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-slate-600 font-medium">{key}</span>
                      <span className="font-bold text-violet-700">{val}</span>
                    </div>
                    <ScoreBar value={val} color="bg-violet-500" />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Standards Alignment</p>
              <div className="space-y-2.5">
                {[
                  { key: 'dcat', label: 'DCAT-AP 3' },
                  { key: 'metadata_completeness', label: 'Metadata' },
                  { key: 'governance_maturity', label: 'Governance' },
                ].map(({ key, label }) => {
                  const val = analysis.standards_alignment[key as keyof typeof analysis.standards_alignment];
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">{label}</span>
                        <span className="font-bold text-sg">{val}</span>
                      </div>
                      <ScoreBar value={val} color="bg-sg" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Gap Distribution</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Critical', count: criticalGaps.length, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
                  { label: 'High',     count: highGaps.length,     color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
                  { label: 'Medium',   count: mediumGaps.length,   color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
                  { label: 'Low',      count: lowGaps.length,      color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
                ].map(({ label, count, color, bg }) => (
                  <div key={label} className={`rounded-lg border p-3 text-center ${bg}`}>
                    <p className={`text-2xl font-bold ${color}`}>{count}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Info className="h-3 w-3" /> About this tool
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Aligned to TOGAF 9.2, DAMA-DMBOK 2, FAIR Principles, DCAT-AP 3, UK GDS, Cyber Essentials, ISO 27001.
                Vendor-neutral with open-source recommendations.
              </p>
            </div>
          </aside>
        </main>
      )}

      {/* ── GENERATING phase ─────────────────────────────────────────────── */}
      {phase === 'generating' && (
        <div className="fixed inset-0 bg-sg-text/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-panel p-8 text-center max-w-sm mx-4">
            <div className="relative inline-flex items-center justify-center h-16 w-16 mb-5">
              <div className="absolute inset-0 rounded-full bg-sg/15 animate-ping" />
              <div className="relative rounded-full bg-sg/20 p-4">
                <FileText className="h-8 w-8 text-sg animate-pulse" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-sg-text">Generating report…</h2>
            <p className="mt-1 text-sm text-slate-500">Creating your consulting-grade architecture gap report</p>
            {report && (
              <p className="mt-3 text-xs text-sg font-semibold">{report.split('\n').find(l => l.trim())?.slice(0, 60)}…</p>
            )}
          </div>
        </div>
      )}

      {/* ── REPORT phase ─────────────────────────────────────────────────── */}
      {phase === 'report' && (
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
            {/* Report header */}
            <div className="bg-sg rounded-xl px-6 py-5 mb-8 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Data Architecture Gap Analysis Report</p>
                  <p className="text-xl font-bold mt-0.5">{analysis?.architecture_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60">Maturity score</p>
                  <p className="text-3xl font-bold">{analysis?.maturity_score.toFixed(1)}</p>
                  <p className="text-xs text-white/80">{analysis?.maturity_classification}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {[
                  { label: 'Critical', count: criticalGaps.length, color: 'text-red-300' },
                  { label: 'High',     count: highGaps.length,     color: 'text-orange-300' },
                  { label: 'Medium',   count: mediumGaps.length,   color: 'text-yellow-300' },
                  { label: 'Low',      count: lowGaps.length,      color: 'text-green-300' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="rounded-lg bg-white/10 px-3 py-2 text-center">
                    <p className={`text-xl font-bold ${color}`}>{count}</p>
                    <p className="text-[10px] text-white/60 font-semibold">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Report body */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-card px-8 py-8">
              <MarkdownReport markdown={report} />
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => { setPhase('review'); }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Back to review
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-lg bg-sg px-4 py-2 text-sm font-bold text-white hover:bg-sg-hover transition-colors"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

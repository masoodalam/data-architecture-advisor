import {
  AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight,
  Clock, FileText, FileType2, Info, RefreshCw, Upload, X, Zap,
} from 'lucide-react';
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import {
  type ClarifyingQuestion, type GapAnalysis, type GapItem,
  type GapJob, type JobStep, type Stage1Result,
  createJob, fetchJob, filePreviewUrl, retryJob, submitAnswer, triggerReport,
} from '../services/gapService';

// ── Constants ──────────────────────────────────────────────────────────────────

const ACCEPTED = 'image/png,image/jpeg,image/jpg,image/gif,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword';
const IMAGE_TYPES = new Set(['image/png','image/jpeg','image/jpg','image/gif','image/webp']);

const ALL_STEPS = [
  { id: 'upload_received',      label: 'Upload received' },
  { id: 'preparing_file',       label: 'Preparing file' },
  { id: 'reading_architecture', label: 'Reading architecture' },
  { id: 'identifying_components', label: 'Identifying components' },
  { id: 'mapping_data_flows',   label: 'Mapping data flows' },
  { id: 'detecting_gaps',       label: 'Detecting gaps' },
  { id: 'assessing_maturity',   label: 'Assessing maturity' },
  { id: 'checking_fair',        label: 'Checking FAIR alignment' },
  { id: 'checking_standards',   label: 'Checking DCAT & UK standards' },
  { id: 'preparing_questions',  label: 'Preparing clarifying questions' },
  { id: 'building_report',      label: 'Building report' },
];

const SEV_COLOR:  Record<string,string> = { critical:'bg-red-50 border-red-300 text-red-800',     high:'bg-orange-50 border-orange-300 text-orange-800', medium:'bg-yellow-50 border-yellow-300 text-yellow-800', low:'bg-green-50 border-green-300 text-green-800' };
const SEV_BADGE:  Record<string,string> = { critical:'bg-red-100 text-red-700 border border-red-200',   high:'bg-orange-100 text-orange-700 border border-orange-200', medium:'bg-yellow-100 text-yellow-700 border border-yellow-200', low:'bg-green-100 text-green-700 border border-green-200' };
const SEV_DOT:    Record<string,string> = { critical:'bg-red-500', high:'bg-orange-500', medium:'bg-yellow-500', low:'bg-green-500' };
const SEV_TEXT:   Record<string,string> = { critical:'text-red-700', high:'text-orange-700', medium:'text-yellow-700', low:'text-green-700' };

// ── Small reusable components ──────────────────────────────────────────────────

function ScoreBar({ value, color = 'bg-sg' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100">
      <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const c = score >= 4 ? 'bg-green-100 text-green-700' : score >= 3 ? 'bg-yellow-100 text-yellow-700' : score >= 2 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold ${c}`}>{score.toFixed(1)}</span>;
}

function StepRow({ step, stepDef }: { step?: JobStep; stepDef: { id: string; label: string } }) {
  if (!step) {
    return (
      <div className="flex items-center gap-2.5 py-1.5">
        <div className="h-4 w-4 rounded-full border-2 border-slate-200 flex-shrink-0" />
        <span className="text-xs text-slate-400">{stepDef.label}</span>
      </div>
    );
  }
  if (step.status === 'active') {
    return (
      <div className="flex items-start gap-2.5 py-1.5">
        <div className="h-4 w-4 rounded-full border-2 border-sg border-t-transparent animate-spin flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-semibold text-sg">{stepDef.label}</span>
          {step.detail && <p className="text-[10px] text-slate-400 mt-0.5">{step.detail}</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <CheckCircle2 className="h-4 w-4 text-sg-success flex-shrink-0 mt-0.5" />
      <div>
        <span className="text-xs text-slate-600">{stepDef.label}</span>
        {step.detail && <p className="text-[10px] text-slate-400 mt-0.5">{step.detail}</p>}
      </div>
    </div>
  );
}

function GapCard({ gap }: { gap: GapItem }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`rounded-lg border p-3 cursor-pointer hover:shadow-card ${SEV_COLOR[gap.severity]}`} onClick={() => setOpen(o => !o)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-0.5 ${SEV_DOT[gap.severity]}`} />
          <span className="text-xs font-bold truncate">{gap.label}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <ScorePill score={gap.score} />
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${SEV_BADGE[gap.severity]}`}>{gap.severity}</span>
          <ChevronRight className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </div>
      {open && (
        <div className="mt-2 space-y-1.5 text-xs">
          <p className="leading-relaxed">{gap.finding}</p>
          <p className="font-semibold">Fix: <span className="font-normal">{gap.recommendation}</span></p>
          {gap.tools.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {gap.tools.map(t => <span key={t} className="rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-semibold border">{t}</span>)}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function QuestionWidget({ q, onAnswer, disabled }: { q: ClarifyingQuestion; onAnswer: (a: string) => void; disabled: boolean }) {
  const [sel, setSel] = useState<string[]>([]);
  const [txt, setTxt] = useState('');

  if (q.type === 'yes_no') {
    return (
      <div className="flex gap-2 mt-3">
        {['Yes','No'].map(o => (
          <button key={o} disabled={disabled} onClick={() => onAnswer(o)}
            className="flex-1 rounded-lg border-2 border-sg py-2 text-sm font-bold text-sg hover:bg-sg hover:text-white disabled:opacity-40 transition-colors">
            {o}
          </button>
        ))}
      </div>
    );
  }

  if (q.type === 'multiple_choice') {
    const toggle = (o: string) => setSel(s => s.includes(o) ? s.filter(x => x !== o) : [...s, o]);
    return (
      <div className="mt-3 space-y-1.5">
        {q.options.map(o => (
          <button key={o} onClick={() => toggle(o)} disabled={disabled}
            className={`w-full rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors disabled:opacity-40 ${sel.includes(o) ? 'border-sg bg-sg-light text-sg font-semibold' : 'border-slate-200 hover:border-sg/50'}`}>
            {sel.includes(o) && <span className="mr-2">✓</span>}{o}
          </button>
        ))}
        {sel.length > 0 && (
          <button onClick={() => onAnswer(sel.join(', '))} disabled={disabled}
            className="mt-1 w-full rounded-lg bg-sg py-2 text-sm font-bold text-white disabled:opacity-40 hover:bg-sg-hover transition-colors">
            Confirm selection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 flex gap-2">
      <input className="flex-1 rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-sg focus:outline-none"
        placeholder="Type your answer…" value={txt} onChange={e => setTxt(e.target.value)}
        disabled={disabled}
        onKeyDown={e => { if (e.key === 'Enter' && txt.trim() && !disabled) { onAnswer(txt.trim()); setTxt(''); } }} />
      <button disabled={!txt.trim() || disabled} onClick={() => { onAnswer(txt.trim()); setTxt(''); }}
        className="rounded-lg bg-sg px-4 py-2 text-sm font-bold text-white disabled:opacity-40 hover:bg-sg-hover transition-colors">
        Send
      </button>
    </div>
  );
}

function MarkdownReport({ markdown }: { markdown: string }) {
  const elements: ReactElement[] = [];
  let key = 0;
  for (const line of markdown.split('\n')) {
    if      (line.startsWith('# '))  elements.push(<h1 key={key++} className="text-2xl font-bold text-sg-text mt-6 mb-3">{line.slice(2)}</h1>);
    else if (line.startsWith('## ')) elements.push(<h2 key={key++} className="text-lg font-bold text-sg mt-5 mb-2 border-b border-slate-100 pb-1">{line.slice(3)}</h2>);
    else if (line.startsWith('### ')) elements.push(<h3 key={key++} className="text-base font-bold text-sg-text mt-4 mb-1.5">{line.slice(4)}</h3>);
    else if (line.startsWith('- ') || line.startsWith('* ')) elements.push(<li key={key++} className="ml-4 text-sm text-slate-700 leading-6 list-disc">{line.slice(2)}</li>);
    else if (/^\d+\. /.test(line))   elements.push(<li key={key++} className="ml-4 text-sm text-slate-700 leading-6 list-decimal">{line.replace(/^\d+\. /,'')}</li>);
    else if (line.trim() === '')     elements.push(<div key={key++} className="h-2" />);
    else                             elements.push(<p key={key++} className="text-sm text-slate-700 leading-7">{line}</p>);
  }
  return <div className="space-y-0.5">{elements}</div>;
}

// ── Right panel: metrics ───────────────────────────────────────────────────────

function MetricsPanel({ analysis, components }: { analysis: GapAnalysis | null; components: Stage1Result | null }) {
  const fair  = analysis?.fair_scores;
  const std   = analysis?.standards_alignment;
  const score = analysis?.maturity_score ?? components?.initial_maturity ?? null;

  return (
    <aside className="hidden xl:flex w-72 flex-col border-l border-slate-200 bg-white overflow-y-auto flex-shrink-0">
      {/* Maturity */}
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Maturity Score</p>
        {score ? (
          <>
            <div className="flex items-end justify-between mb-1">
              <span className="text-3xl font-bold text-sg-text">{score.toFixed(1)}</span>
              <span className="text-xs font-semibold text-sg mb-1">{analysis?.maturity_classification ?? 'Analysing…'}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-sg transition-all duration-700" style={{ width: `${((score - 1) / 4) * 100}%` }} />
            </div>
          </>
        ) : (
          <div className="h-8 rounded bg-slate-100 animate-pulse" />
        )}
      </div>

      {/* FAIR */}
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">FAIR Principles</p>
        <div className="space-y-2.5">
          {['findable','accessible','interoperable','reusable'].map(k => {
            const v = fair?.[k as keyof typeof fair] ?? 0;
            return (
              <div key={k}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize text-slate-600 font-medium">{k}</span>
                  <span className="font-bold text-violet-700">{v}</span>
                </div>
                <ScoreBar value={v} color="bg-violet-500" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Standards */}
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Standards Alignment</p>
        <div className="space-y-2.5">
          {[{k:'dcat',l:'DCAT-AP 3'},{k:'metadata_completeness',l:'Metadata'},{k:'governance_maturity',l:'Governance'}].map(({ k, l }) => {
            const v = std?.[k as keyof typeof std] ?? 0;
            return (
              <div key={k}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">{l}</span>
                  <span className="font-bold text-sg">{v}</span>
                </div>
                <ScoreBar value={v} color="bg-sg" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Components (stage 1 early results) */}
      {components && !analysis && (
        <div className="p-4 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Early Findings</p>
          {components.immediate_concerns.slice(0, 3).map(c => (
            <div key={c} className="flex items-start gap-1.5 mb-1.5">
              <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0 mt-0.5" />
              <span className="text-[10px] text-slate-600">{c}</span>
            </div>
          ))}
          {components.visible_strengths.slice(0, 2).map(s => (
            <div key={s} className="flex items-start gap-1.5 mb-1.5">
              <CheckCircle2 className="h-3 w-3 text-sg-success flex-shrink-0 mt-0.5" />
              <span className="text-[10px] text-slate-600">{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Gap distribution */}
      {analysis && (
        <div className="p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Gap Distribution</p>
          <div className="grid grid-cols-2 gap-2">
            {(['critical','high','medium','low'] as const).map(sev => {
              const count = analysis.gaps.filter(g => g.severity === sev).length;
              return (
                <div key={sev} className={`rounded-lg border p-3 text-center ${SEV_COLOR[sev]}`}>
                  <p className={`text-2xl font-bold ${SEV_TEXT[sev]}`}>{count}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5 capitalize">{sev}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-slate-100 mt-auto">
        <p className="text-[10px] text-slate-400 leading-relaxed flex items-start gap-1">
          <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
          Aligned to TOGAF 9.2, DAMA-DMBOK 2, FAIR, DCAT-AP 3, UK GDS, Cyber Essentials, ISO 27001.
        </p>
      </div>
    </aside>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'gap_job_id';

export function GapAnalysisPage({ onBack }: { onBack: () => void }) {
  const [jobId,       setJobId]       = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [job,         setJob]         = useState<GapJob | null>(null);
  const [dragOver,    setDragOver]    = useState(false);
  const [imagePreview,setImagePreview]= useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType,    setMimeType]    = useState('image/png');
  const [fileName,    setFileName]    = useState('');
  const [context,     setContext]     = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentQ,    setCurrentQ]    = useState<ClarifyingQuestion | null>(null);
  const [answering,   setAnswering]   = useState(false);
  const [answerCount, setAnswerCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derived phase ──────────────────────────────────────────────────────────

  const status = job?.status ?? (jobId ? 'pending' : null);
  const phase  =
    !jobId                                                             ? 'upload'
    : status === 'needs_clarification'                                 ? 'clarification'
    : status === 'generating_report'                                   ? 'generating'
    : status === 'completed'                                           ? 'report'
    : status === 'failed'                                              ? 'failed'
    : 'processing'; // pending | processing | retrying

  // ── Polling ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!jobId) return;

    const interval = status === 'generating_report' ? 1000 : status === 'needs_clarification' ? 4000 : 2000;

    pollRef.current = setInterval(async () => {
      try {
        const updated = await fetchJob(jobId);
        setJob(updated);
        if (['completed', 'failed'].includes(updated.status)) {
          clearInterval(pollRef.current!);
        }
      } catch {
        // network blip — keep polling
      }
    }, interval);

    return () => clearInterval(pollRef.current!);
  }, [jobId, status]);

  // ── Update current question when analysis changes ─────────────────────────

  useEffect(() => {
    if (!job?.analysis) return;
    const pending = job.analysis.clarifying_questions.filter(q => !q.answered);
    setCurrentQ(pending[0] ?? null);
  }, [job?.analysis]);

  // ── File load ──────────────────────────────────────────────────────────────

  const loadFile = useCallback((file: File) => {
    const accepted = ACCEPTED.split(',');
    if (!accepted.includes(file.type)) {
      setUploadError('Unsupported file type. Please upload an image (PNG/JPG/GIF/WebP), PDF, or Word document (.docx).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File is too large (max 8 MB). Please reduce the file size and try again.');
      return;
    }
    setMimeType(file.type);
    setFileName(file.name);
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      if (IMAGE_TYPES.has(file.type)) setImagePreview(dataUrl);
      else setImagePreview(null);
      setImageBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0]; if (f) loadFile(f);
  }, [loadFile]);

  // ── Create job ─────────────────────────────────────────────────────────────

  async function startAnalysis() {
    if (!imageBase64) return;
    setUploading(true); setUploadError(null);
    try {
      const { jobId: id } = await createJob(imageBase64, mimeType, context);
      localStorage.setItem(STORAGE_KEY, id);
      setJobId(id);
      setImageBase64(null); // free memory
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  // ── Answer question ────────────────────────────────────────────────────────

  async function handleAnswer(answer: string) {
    if (!jobId || !currentQ) return;
    setAnswering(true);
    try {
      await submitAnswer(jobId, currentQ.id, currentQ.question, answer);
      setAnswerCount(c => c + 1);
      // Poll immediately after answer
      const updated = await fetchJob(jobId);
      setJob(updated);
    } catch {
      // ignore, keep polling
    } finally {
      setAnswering(false);
    }
  }

  function skipQuestion() {
    if (!job?.analysis) return;
    const pending = job.analysis.clarifying_questions.filter(q => !q.answered && q.id !== currentQ?.id);
    setCurrentQ(pending[0] ?? null);
    setAnswerCount(c => c + 1);
  }

  async function handleGenerateReport() {
    if (!jobId) return;
    await triggerReport(jobId);
    const updated = await fetchJob(jobId);
    setJob(updated);
  }

  async function handleRetry() {
    if (!jobId) return;
    await retryJob(jobId);
    const updated = await fetchJob(jobId);
    setJob(updated);
  }

  function startNew() {
    clearInterval(pollRef.current!);
    localStorage.removeItem(STORAGE_KEY);
    setJobId(null); setJob(null);
    setImagePreview(null); setImageBase64(null);
    setFileName(''); setContext(''); setUploadError(null);
    setCurrentQ(null); setAnswerCount(0);
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const steps      = job?.steps ?? [];
  const stepMap    = Object.fromEntries(steps.map(s => [s.name, s]));
  const analysis   = job?.analysis ?? null;
  const components = job?.components ?? null;

  const criticalGaps = analysis?.gaps.filter(g => g.severity === 'critical') ?? [];
  const highGaps     = analysis?.gaps.filter(g => g.severity === 'high')     ?? [];
  const mediumGaps   = analysis?.gaps.filter(g => g.severity === 'medium')   ?? [];
  const lowGaps      = analysis?.gaps.filter(g => g.severity === 'low')      ?? [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-sg-surface flex flex-col">

      {/* Top bar */}
      <nav className="bg-sg border-b border-sg-hover flex-shrink-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <span className="text-sm font-bold text-white">Architecture Gap Analysis</span>
            {job && <span className="text-[10px] text-white/40 font-mono hidden sm:block">{jobId?.slice(0,8)}</span>}
          </div>
          <div className="flex items-center gap-3">
            {job && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Progress</span>
                <div className="h-1.5 w-28 rounded-full bg-white/20">
                  <div className="h-1.5 rounded-full bg-white transition-all duration-500" style={{ width: `${job.progress}%` }} />
                </div>
                <span className="text-xs text-white font-bold">{job.progress}%</span>
              </div>
            )}
            {jobId && (
              <button onClick={startNew} className="text-xs text-white/60 hover:text-white transition-colors">
                New analysis
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── UPLOAD ─────────────────────────────────────────────────────────── */}
      {phase === 'upload' && (
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-sg mb-4">
                <Upload className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-sg-text">Upload Architecture Document</h1>
              <p className="mt-2 text-sm text-slate-500">AI-powered gap analysis across 18 dimensions — TOGAF, FAIR, DCAT-AP 3, UK GDS</p>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${dragOver ? 'border-sg bg-sg-light' : 'border-slate-300 hover:border-sg/60 bg-white'}`}
            >
              <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />

              {imageBase64 && imagePreview ? (
                <div className="relative p-4">
                  <img src={imagePreview} alt="Preview" className="mx-auto max-h-64 rounded-lg object-contain" />
                  <button onClick={e => { e.stopPropagation(); setImagePreview(null); setImageBase64(null); setFileName(''); }}
                    className="absolute top-2 right-2 rounded-full bg-white p-1 shadow-sm hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : imageBase64 && !imagePreview ? (
                <div className="relative p-6 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-sg-light border border-sg/20 flex items-center justify-center flex-shrink-0">
                    <FileType2 className="h-7 w-7 text-sg" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-sg-text truncate">{fileName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Ready to analyse — text will be extracted automatically</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setImageBase64(null); setFileName(''); }}
                    className="ml-auto rounded-full bg-white p-1 shadow-sm hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
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

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Additional context (optional)</label>
              <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:border-sg focus:outline-none"
                rows={3} value={context} onChange={e => setContext(e.target.value)}
                placeholder="e.g. This is our current AWS data platform. We're planning to migrate to a data mesh approach…" />
            </div>

            {uploadError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {uploadError}
              </div>
            )}

            <button onClick={startAnalysis} disabled={!imageBase64 || uploading}
              className="mt-5 w-full rounded-xl bg-sg py-3 text-sm font-bold text-white disabled:opacity-40 hover:bg-sg-hover transition-colors shadow-lg flex items-center justify-center gap-2">
              {uploading ? <><div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Uploading…</> : 'Analyse Architecture'}
            </button>
          </div>
        </main>
      )}

      {/* ── PROCESSING ─────────────────────────────────────────────────────── */}
      {phase === 'processing' && (
        <main className="flex-1 flex min-h-0 overflow-hidden">

          {/* Left: activity feed */}
          <aside className="w-72 xl:w-80 flex-col border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0 hidden md:flex">
            <div className="p-5 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Analysis in progress</p>
              {status === 'retrying' && (
                <div className="flex items-center gap-1.5 text-xs text-orange-600 mb-2">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Retrying automatically…
                </div>
              )}
              <div className="h-1.5 w-full rounded-full bg-slate-100 mt-2">
                <div className="h-1.5 rounded-full bg-sg transition-all duration-700" style={{ width: `${job?.progress ?? 5}%` }} />
              </div>
            </div>
            <div className="flex-1 p-5 overflow-y-auto">
              {ALL_STEPS.filter(s => s.id !== 'building_report').map(def => (
                <StepRow key={def.id} stepDef={def} step={stepMap[def.id]} />
              ))}
            </div>
          </aside>

          {/* Center: partial results */}
          <section className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
            <div className="text-center max-w-lg">
              <div className="relative inline-flex items-center justify-center h-20 w-20 mb-6">
                <div className="absolute inset-0 rounded-full bg-sg/10 animate-ping" />
                <div className="relative rounded-full bg-sg/20 p-5">
                  <Zap className="h-10 w-10 text-sg animate-pulse" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-sg-text">Analysing your architecture…</h2>
              <p className="mt-2 text-sm text-slate-500">Claude is working through 18 architectural dimensions</p>

              {/* Early component results */}
              {components && (
                <div className="mt-6 text-left rounded-xl bg-white border border-slate-200 p-5 shadow-card">
                  <p className="text-xs font-bold text-sg uppercase tracking-wide mb-3">Early Findings</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {components.components.slice(0, 8).map(c => (
                      <span key={c} className="rounded-full bg-sg-light text-sg text-[10px] font-semibold px-2 py-0.5">{c}</span>
                    ))}
                    {components.components.length > 8 && (
                      <span className="rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5">+{components.components.length - 8} more</span>
                    )}
                  </div>
                  {components.immediate_concerns.length > 0 && (
                    <div className="space-y-1">
                      {components.immediate_concerns.slice(0, 3).map(c => (
                        <div key={c} className="flex items-start gap-2 text-xs text-orange-700">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" /> {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <MetricsPanel analysis={null} components={components} />
        </main>
      )}

      {/* ── CLARIFICATION (3-panel) ─────────────────────────────────────────── */}
      {phase === 'clarification' && analysis && (
        <main className="flex-1 flex min-h-0 overflow-hidden">

          {/* Left: diagram + severity summary */}
          <aside className="hidden lg:flex w-72 xl:w-80 flex-col border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0">
            <div className="p-4 border-b border-slate-100">
              {jobId && IMAGE_TYPES.has(job?.mimeType ?? '') ? (
                <img src={filePreviewUrl(jobId)} alt="Diagram" className="w-full rounded-lg object-contain max-h-44 bg-slate-50 border border-slate-100" />
              ) : (
                <div className="w-full h-24 rounded-lg bg-sg-light border border-sg/20 flex flex-col items-center justify-center gap-2">
                  <FileType2 className="h-8 w-8 text-sg" />
                  <span className="text-xs font-semibold text-sg">Document analysed</span>
                </div>
              )}
            </div>
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Maturity</span>
                <span className="text-xl font-bold text-sg-text">{analysis.maturity_score.toFixed(1)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-sg transition-all" style={{ width: `${((analysis.maturity_score - 1) / 4) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400">Ad hoc</span>
                <span className="text-[10px] font-semibold text-sg">{analysis.maturity_classification}</span>
                <span className="text-[10px] text-slate-400">Optimised</span>
              </div>
            </div>
            <div className="p-4 border-b border-slate-100">
              <span className="rounded-full bg-sg-light text-sg text-xs font-bold px-2.5 py-1">{analysis.architecture_type}</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Gap severity</p>
              {([['critical','bg-red-500','text-red-700'],['high','bg-orange-500','text-orange-700'],['medium','bg-yellow-500','text-yellow-700'],['low','bg-green-500','text-green-700']] as const).map(([sev, dot, text]) => (
                <div key={sev} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
                  <span className="text-xs text-slate-600 flex-1 capitalize">{sev}</span>
                  <span className={`text-xs font-bold ${text}`}>{analysis.gaps.filter(g => g.severity === sev).length}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Center: gaps + question */}
          <section className="flex-1 flex flex-col min-w-0 overflow-y-auto">
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
              {criticalGaps.length + highGaps.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" /> Critical &amp; High Priority Gaps
                  </h2>
                  <div className="space-y-2">{[...criticalGaps,...highGaps].map(g => <GapCard key={g.category} gap={g} />)}</div>
                </div>
              )}
              {mediumGaps.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-2">Medium Priority Gaps</h2>
                  <div className="space-y-2">{mediumGaps.map(g => <GapCard key={g.category} gap={g} />)}</div>
                </div>
              )}
              {lowGaps.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">Strengths</h2>
                  <div className="space-y-2">{lowGaps.map(g => <GapCard key={g.category} gap={g} />)}</div>
                </div>
              )}
            </div>

            {/* Question dock */}
            <div className="border-t border-slate-200 bg-white p-5 flex-shrink-0">
              {currentQuestion ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${SEV_BADGE[currentQ?.priority === 'high' ? 'high' : currentQ?.priority === 'medium' ? 'medium' : 'low']}`}>
                      {currentQ?.priority} priority
                    </span>
                    <span className="text-[10px] text-slate-400">{currentQ?.category} · {answerCount} of {analysis.clarifying_questions.length} answered</span>
                    {answering && <div className="h-3 w-3 rounded-full border-2 border-sg border-t-transparent animate-spin" />}
                  </div>
                  <p className="text-sm font-semibold text-sg-text">{currentQ?.question}</p>
                  {currentQ && <QuestionWidget q={currentQ} onAnswer={handleAnswer} disabled={answering} />}
                  <button onClick={skipQuestion} className="mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors">Skip this question</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-sg-success" />
                    <div>
                      <p className="text-sm font-bold text-sg-text">Ready to generate report</p>
                      <p className="text-xs text-slate-500">{analysis.report_readiness}% readiness · {answerCount} questions answered</p>
                    </div>
                  </div>
                  <button onClick={handleGenerateReport}
                    className="flex items-center gap-2 rounded-xl bg-sg px-5 py-2.5 text-sm font-bold text-white hover:bg-sg-hover transition-colors shadow-lg">
                    <FileText className="h-4 w-4" /> Generate Report
                  </button>
                </div>
              )}
              {currentQ && (
                <div className="mt-4 flex justify-end">
                  <button onClick={handleGenerateReport} disabled={analysis.report_readiness < 30}
                    className="flex items-center gap-2 rounded-xl bg-sg px-4 py-2 text-xs font-bold text-white disabled:opacity-30 hover:bg-sg-hover transition-colors">
                    <FileText className="h-3.5 w-3.5" />
                    Generate Report{analysis.report_readiness < 30 ? ` (${analysis.report_readiness}% ready)` : ''}
                  </button>
                </div>
              )}
            </div>
          </section>

          <MetricsPanel analysis={analysis} components={null} />
        </main>
      )}

      {/* ── GENERATING overlay ──────────────────────────────────────────────── */}
      {phase === 'generating' && (
        <>
          {/* Keep the clarification view visible underneath */}
          {analysis && (
            <div className="flex-1 overflow-y-auto opacity-30 pointer-events-none">
              <div className="p-8 text-center text-slate-400 text-sm">Report generating…</div>
            </div>
          )}
          <div className="fixed inset-0 bg-sg-text/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-panel p-8 text-center max-w-sm mx-4 w-full">
              <div className="relative inline-flex items-center justify-center h-16 w-16 mb-5">
                <div className="absolute inset-0 rounded-full bg-sg/15 animate-ping" />
                <div className="relative rounded-full bg-sg/20 p-4">
                  <FileText className="h-8 w-8 text-sg animate-pulse" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-sg-text">Generating report…</h2>
              <p className="mt-1 text-sm text-slate-500">Writing your consulting-grade gap report</p>
              <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-sg transition-all duration-500" style={{ width: `${job?.progress ?? 80}%` }} />
              </div>
              {job?.report && (
                <p className="mt-3 text-xs text-sg font-semibold line-clamp-2">
                  {job.report.split('\n').find(l => l.trim())?.slice(0, 60)}…
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── REPORT ─────────────────────────────────────────────────────────── */}
      {phase === 'report' && job?.report && (
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
            <div className="bg-sg rounded-xl px-6 py-5 mb-8 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Architecture Gap Analysis Report</p>
                  <p className="text-xl font-bold mt-0.5">{analysis?.architecture_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60">Maturity score</p>
                  <p className="text-3xl font-bold">{analysis?.maturity_score.toFixed(1)}</p>
                  <p className="text-xs text-white/80">{analysis?.maturity_classification}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {(['critical','high','medium','low'] as const).map(sev => {
                  const colors = { critical:'text-red-300', high:'text-orange-300', medium:'text-yellow-300', low:'text-green-300' };
                  return (
                    <div key={sev} className="rounded-lg bg-white/10 px-3 py-2 text-center">
                      <p className={`text-xl font-bold ${colors[sev]}`}>{analysis?.gaps.filter(g => g.severity === sev).length ?? 0}</p>
                      <p className="text-[10px] text-white/60 font-semibold capitalize">{sev}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-card px-8 py-8">
              <MarkdownReport markdown={job.report} />
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setJob(j => j ? { ...j, status: 'needs_clarification' } : j)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Back to review
              </button>
              <button onClick={() => window.print()}
                className="rounded-lg bg-sg px-4 py-2 text-sm font-bold text-white hover:bg-sg-hover transition-colors">
                Print / Save PDF
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ── FAILED ─────────────────────────────────────────────────────────── */}
      {phase === 'failed' && (
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-red-50 border border-red-200 mb-5">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-sg-text">Analysis failed</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {job?.error?.includes('timeout') || job?.error?.includes('timed out')
                ? 'The analysis timed out. This can happen with complex diagrams. Your file is preserved — click Retry to try again.'
                : job?.error ?? 'An unexpected error occurred.'}
            </p>
            {/* Partial results if available */}
            {analysis && (
              <div className="mt-4 rounded-lg bg-orange-50 border border-orange-200 px-4 py-3 text-xs text-orange-800 text-left">
                <p className="font-bold mb-1">Partial analysis available</p>
                <p>Maturity: {analysis.maturity_score.toFixed(1)} · {analysis.gaps.length} gap categories assessed</p>
                <button onClick={() => setJob(j => j ? { ...j, status: 'needs_clarification' } : j)}
                  className="mt-2 text-sg font-semibold hover:underline">View partial results →</button>
              </div>
            )}
            <div className="mt-5 flex gap-3 justify-center">
              <button onClick={handleRetry}
                className="flex items-center gap-2 rounded-xl bg-sg px-5 py-2.5 text-sm font-bold text-white hover:bg-sg-hover transition-colors shadow-lg">
                <RefreshCw className="h-4 w-4" /> Retry analysis
              </button>
              <button onClick={startNew}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Start new
              </button>
            </div>
            {/* Steps completed before failure */}
            {steps.length > 0 && (
              <div className="mt-6 text-left rounded-lg bg-white border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Completed before failure</p>
                {ALL_STEPS.filter(d => stepMap[d.id]?.status === 'done').map(d => (
                  <div key={d.id} className="flex items-center gap-2 py-0.5">
                    <CheckCircle2 className="h-3 w-3 text-sg-success flex-shrink-0" />
                    <span className="text-xs text-slate-600">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

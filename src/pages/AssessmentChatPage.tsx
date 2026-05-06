import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Bot, Building2, Database, Globe, FileCheck2,
  Lock, BarChart2, Wrench, DollarSign, Loader2, Send,
  AlertTriangle, Lightbulb, Eye, TrendingUp, ChevronRight,
  SkipForward,
} from 'lucide-react';
import {
  sendAssessmentMessage,
  DEFAULT_DOMAIN_PROGRESS, DEFAULT_FAIR, DEFAULT_STANDARDS,
} from '../services/aiService';
import type {
  AssessmentTurn, ChatMessage, DomainProgress, FairScores,
  StandardsAlignment, InsightFeedItem, LiveReport,
} from '../services/aiService';
import type { AssessmentResult } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  onComplete: (result: AssessmentResult) => void;
  onBack: () => void;
  onTraditional: () => void;
}

interface ConversationTurn {
  userMessage: string;
  response: AssessmentTurn;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOADING_PHASES = [
  { text: 'Analysing your response…', icon: '⚙' },
  { text: 'Identifying architectural gaps…', icon: '🔍' },
  { text: 'Mapping to standards…', icon: '📐' },
  { text: 'Preparing next question…', icon: '💬' },
];

const DOMAIN_META: Record<keyof DomainProgress, { label: string; Icon: typeof Bot }> = {
  business_goals: { label: 'Business goals',  Icon: Building2  },
  data_sources:   { label: 'Data sources',     Icon: Database   },
  architecture:   { label: 'Architecture',     Icon: Globe      },
  governance:     { label: 'Governance',       Icon: FileCheck2 },
  security:       { label: 'Security',         Icon: Lock       },
  analytics:      { label: 'Analytics',        Icon: BarChart2  },
  operations:     { label: 'Operations',       Icon: Wrench     },
  cost:           { label: 'Cost',             Icon: DollarSign },
};

const IMPACT_STYLE: Record<string, string> = {
  positive: 'bg-sg-success/10 text-sg-success border-sg-success/30',
  Low:      'bg-amber-50 text-amber-700 border-amber-200',
  Medium:   'bg-orange-50 text-orange-700 border-orange-200',
  High:     'bg-red-50 text-red-700 border-red-200',
};

const FEED_STYLE: Record<InsightFeedItem['type'], { bg: string; icon: string; dot: string }> = {
  observation: { bg: 'bg-sg-light border-sg/20',    icon: '🔵', dot: 'bg-sg' },
  risk:        { bg: 'bg-red-50 border-red-200',     icon: '🔴', dot: 'bg-sg-danger' },
  gap:         { bg: 'bg-amber-50 border-amber-200', icon: '🟡', dot: 'bg-sg-warn' },
  opportunity: { bg: 'bg-green-50 border-green-200', icon: '🟢', dot: 'bg-sg-success' },
};

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniBar({ value, colour = 'bg-sg' }: { value: number; colour?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${colour}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function DomainRow({
  domainKey, label, Icon, progress, confidence, active,
}: {
  domainKey: string; label: string; Icon: typeof Bot;
  progress: number; confidence: number; active: boolean;
}) {
  const col = progress >= 65 ? 'bg-sg' : progress > 30 ? 'bg-sg/60' : 'bg-slate-300';
  return (
    <div className={`rounded-lg p-2.5 transition-colors ${active ? 'bg-sg-light' : 'hover:bg-slate-50'}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className={`h-3 w-3 ${active ? 'text-sg' : 'text-slate-400'}`} />
          <span className={`text-xs ${active ? 'font-bold text-sg' : 'text-slate-600'}`}>{label}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>{progress}%</span>
          {confidence > 0 && <span className="text-sg-success">♦{confidence}%</span>}
        </div>
      </div>
      <MiniBar value={progress} colour={col} />
    </div>
  );
}

function InteractionWidget({
  interaction, onAnswer, disabled,
}: {
  interaction: AssessmentTurn['interaction'];
  onAnswer: (v: string) => void;
  disabled: boolean;
}) {
  const [sliderVal, setSliderVal] = useState(interaction.slider?.default ?? 3);

  const btnBase = 'rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95';

  if (interaction.type === 'yes_no' || interaction.type === 'true_false') {
    const [a, b] = interaction.type === 'yes_no' ? ['Yes', 'No'] : ['True', 'False'];
    return (
      <div className="flex gap-3 mt-4">
        <button disabled={disabled} onClick={() => onAnswer(a)}
          className={`${btnBase} flex-1 border-sg bg-sg text-white hover:bg-sg-hover`}>{a}</button>
        <button disabled={disabled} onClick={() => onAnswer(b)}
          className={`${btnBase} flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>{b}</button>
      </div>
    );
  }

  if (interaction.type === 'multiple_choice' && interaction.options?.length) {
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {interaction.options.map(opt => (
          <button key={opt} disabled={disabled} onClick={() => onAnswer(opt)}
            className={`${btnBase} border-sg/30 bg-sg-light text-sg-text hover:bg-sg-light hover:border-sg`}>
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (interaction.type === 'slider' && interaction.slider) {
    const { min, max, minLabel, maxLabel } = interaction.slider;
    const labels = ['Ad hoc', 'Developing', 'Managed', 'Advanced', 'Optimised'];
    return (
      <div className="mt-4 space-y-3">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{minLabel}</span><span>{maxLabel}</span>
        </div>
        <input
          type="range" min={min} max={max} value={sliderVal}
          disabled={disabled}
          onChange={e => setSliderVal(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-sg disabled:opacity-40"
        />
        <div className="flex justify-between">
          {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
            <button key={n} disabled={disabled} onClick={() => setSliderVal(n)}
              className={`w-8 h-8 rounded-full text-xs font-bold border transition-all ${
                n === sliderVal ? 'bg-sg text-white border-sg scale-110' : 'bg-white text-slate-500 border-slate-200 hover:border-sg'
              }`}>{n}</button>
          ))}
        </div>
        <p className="text-center text-sm font-semibold text-sg">{labels[sliderVal - 1] ?? sliderVal}</p>
        <button disabled={disabled} onClick={() => onAnswer(String(sliderVal))}
          className={`${btnBase} w-full bg-sg text-white border-sg hover:bg-sg-hover`}>
          Confirm: {sliderVal} — {labels[sliderVal - 1]}
        </button>
      </div>
    );
  }

  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AssessmentChatPage({ onComplete, onBack, onTraditional }: Props) {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);

  // Accumulated insights panel state
  const [progress, setProgress] = useState<DomainProgress>(DEFAULT_DOMAIN_PROGRESS);
  const [confidence, setConfidence] = useState<DomainProgress>(DEFAULT_DOMAIN_PROGRESS);
  const [fair, setFair] = useState<FairScores>(DEFAULT_FAIR);
  const [standards, setStandards] = useState<StandardsAlignment>(DEFAULT_STANDARDS);
  const [feedItems, setFeedItems] = useState<InsightFeedItem[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [benchmarking, setBenchmarking] = useState<string | null>(null);
  const [liveReport, setLiveReport] = useState<LiveReport>({
    current_state_summary: '', top_risks: [], report_completeness: 0, report_confidence: 'Low',
  });
  const [currentDomain, setCurrentDomain] = useState('');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!hasStarted.current) { hasStarted.current = true; send(''); }
  }, []);

  useEffect(() => {
    if (!isLoading) { setLoadingPhase(0); return; }
    const timers = LOADING_PHASES.map((_, i) => setTimeout(() => setLoadingPhase(i), i * 1800));
    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

  async function send(userMessage: string) {
    if (isLoading || completing) return;
    setError('');
    setIsLoading(true);

    const history: ChatMessage[] = turns.flatMap(t => {
      const msgs: ChatMessage[] = [];
      if (t.userMessage) msgs.push({ role: 'user', content: t.userMessage });
      msgs.push({ role: 'assistant', content: JSON.stringify(t.response) });
      return msgs;
    });

    try {
      const response = await sendAssessmentMessage(userMessage, history);

      setTurns(prev => [...prev, { userMessage, response }]);
      setProgress(response.assessment_progress);
      setConfidence(response.domain_confidence ?? DEFAULT_DOMAIN_PROGRESS);
      setFair(response.fair_scores);
      setStandards(response.standards_alignment);
      setCurrentDomain(response.domain);
      if (response.insight_feed?.length) {
        setFeedItems(prev => [...response.insight_feed, ...prev].slice(0, 20));
      }
      if (response.patterns_detected?.length) {
        setPatterns(prev => [...new Set([...prev, ...response.patterns_detected])]);
      }
      if (response.benchmarking) setBenchmarking(response.benchmarking);
      if (response.live_report) setLiveReport(response.live_report);

      if (response.is_complete && response.result) {
        setCompleting(true);
        setTimeout(() => onComplete(response.result!), 2000);
      }

      setTimeout(() => centerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (textInput.trim()) { send(textInput); setTextInput(''); } }
  }

  const lastTurn = turns[turns.length - 1];
  const showTextInput = !isLoading && !completing &&
    (turns.length === 0 || lastTurn?.response.interaction.type === 'open_text');
  const overallPct = Math.round(Object.values(progress).reduce((a, b) => a + b, 0) / 8);
  const confidenceColour = liveReport.report_confidence === 'High' ? 'text-sg-success'
    : liveReport.report_confidence === 'Medium' ? 'text-sg-warn' : 'text-slate-400';

  return (
    <div className="flex h-screen overflow-hidden bg-sg-surface font-sans">

      {/* ════════════════════════════════════════════════════
          LEFT: Conversation history
      ════════════════════════════════════════════════════ */}
      <aside className="hidden xl:flex flex-col w-[240px] flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
        <div className="px-3 py-3 border-b border-slate-100">
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-slate-500 hover:text-sg transition-colors mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <p className="text-xs font-bold text-sg-text">Assessment history</p>
          <p className="text-[10px] text-slate-400">{turns.filter(t => t.userMessage).length} responses recorded</p>
        </div>
        <div className="flex-1 px-2 py-2 space-y-1">
          {turns.filter(t => t.userMessage).map((turn, i) => {
            const dm = DOMAIN_META[turn.response.domain as keyof DomainProgress];
            const Icon = dm?.Icon ?? Bot;
            return (
              <div key={i} className="rounded-lg px-2.5 py-2 hover:bg-sg-light transition-colors cursor-default">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3 w-3 text-sg flex-shrink-0" />
                  <span className="text-[10px] font-semibold text-sg truncate">{dm?.label ?? turn.response.domain}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-4 line-clamp-2">{turn.response.interaction.question || '—'}</p>
                <p className="text-[10px] font-semibold text-sg-text leading-4 mt-0.5 line-clamp-1">{turn.userMessage}</p>
              </div>
            );
          })}
          {turns.length === 0 && (
            <p className="text-[10px] text-slate-400 text-center py-6">Interview not yet started</p>
          )}
        </div>
        <div className="px-3 py-3 border-t border-slate-100">
          <button onClick={onTraditional} className="text-[10px] text-slate-400 underline hover:text-sg">
            Use traditional form instead
          </button>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════
          CENTER: Active question
      ════════════════════════════════════════════════════ */}
      <main className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <header className="flex-shrink-0 bg-sg text-white px-5 py-3 flex items-center gap-4">
          <button onClick={onBack} className="xl:hidden flex items-center gap-1 text-xs text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Data Architecture Assessment</p>
              <span className="text-xs text-white/70 flex-shrink-0 ml-2">{overallPct}% complete</span>
            </div>
            <div className="mt-1 h-1 w-full rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        </header>

        {/* Question area */}
        <div ref={centerRef} className="flex-1 overflow-y-auto px-6 py-6">

          {/* Loading state */}
          {isLoading && (
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl border border-sg/20 bg-sg-light px-6 py-8 text-center">
                <Loader2 className="h-8 w-8 text-sg animate-spin mx-auto mb-4" />
                <p className="text-sm font-semibold text-sg">{LOADING_PHASES[loadingPhase]?.text}</p>
                <div className="mt-4 flex justify-center gap-1.5">
                  {LOADING_PHASES.map((_, i) => (
                    <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-500 ${i <= loadingPhase ? 'bg-sg' : 'bg-sg/20'}`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active question */}
          {!isLoading && lastTurn && !completing && (
            <div className="max-w-2xl mx-auto space-y-4">

              {/* Domain badge */}
              {(() => {
                const dm = DOMAIN_META[lastTurn.response.domain as keyof DomainProgress];
                const Icon = dm?.Icon ?? Bot;
                return (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-sg text-white px-3 py-1 text-xs font-semibold">
                      <Icon className="h-3 w-3" />
                      {dm?.label ?? lastTurn.response.domain}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
                      <div className={`h-1.5 w-1.5 rounded-full ${liveReport.report_confidence === 'High' ? 'bg-sg-success' : liveReport.report_confidence === 'Medium' ? 'bg-sg-warn' : 'bg-slate-300'}`} />
                      {liveReport.report_confidence} confidence
                    </div>
                  </div>
                );
              })()}

              {/* Insight card */}
              <div className="rounded-2xl border border-sg/20 bg-sg-light px-5 py-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-sg flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <p className="text-sm text-sg-text leading-6 font-medium">{lastTurn.response.insight}</p>
                    {lastTurn.response.why_it_matters && (
                      <div className="flex items-start gap-1.5 pt-2 border-t border-sg/10">
                        <Lightbulb className="h-3.5 w-3.5 text-sg flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-sg/80 italic">{lastTurn.response.why_it_matters}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Architecture impact chips */}
                {lastTurn.response.architecture_impact && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(Object.entries(lastTurn.response.architecture_impact) as [string, string | null][])
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <span key={k} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${IMPACT_STYLE[v!] ?? ''}`}>
                          {k}: {v}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Question card */}
              {lastTurn.response.interaction.type !== 'none' && lastTurn.response.interaction.question && (
                <div className="rounded-2xl border-2 border-sg bg-white px-5 py-5 shadow-card">
                  <p className="text-base font-bold text-sg-text leading-7">
                    {lastTurn.response.interaction.question}
                  </p>
                  <InteractionWidget
                    interaction={lastTurn.response.interaction}
                    onAnswer={v => { send(v); setTextInput(''); }}
                    disabled={isLoading || completing}
                  />
                  {lastTurn.response.can_skip && (
                    <button
                      onClick={() => send('[skipped]')}
                      disabled={isLoading || completing}
                      className="mt-3 flex items-center gap-1 text-xs text-slate-400 hover:text-sg transition-colors"
                    >
                      <SkipForward className="h-3 w-3" /> Skip this question
                    </button>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-sg-danger/30 bg-red-50 px-4 py-3 text-sm text-sg-danger">
                  {error} — <button onClick={() => send('')} className="font-semibold underline">retry</button>
                </div>
              )}
            </div>
          )}

          {/* Completing overlay */}
          {completing && (
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl border border-sg bg-sg-light px-8 py-12 text-center">
                <div className="h-14 w-14 rounded-full bg-sg flex items-center justify-center mx-auto mb-5">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-sg-text">Assessment complete</h2>
                <p className="mt-2 text-sm text-slate-600">Generating your full architecture report…</p>
                <Loader2 className="h-5 w-5 animate-spin text-sg mx-auto mt-4" />
              </div>
            </div>
          )}

          {/* Initial empty state */}
          {!isLoading && turns.length === 0 && !error && (
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="h-16 w-16 rounded-full bg-sg flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-slate-500">Connecting to your architect…</p>
            </div>
          )}
        </div>

        {/* Text input */}
        {showTextInput && (
          <div className="flex-shrink-0 border-t border-slate-200 bg-white px-5 py-3">
            <div className="max-w-2xl mx-auto flex gap-2 items-end">
              <textarea
                ref={inputRef} value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type your response…"
                rows={2} disabled={isLoading || completing}
                className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm text-sg-text placeholder:text-slate-400 focus:border-sg focus:outline-none focus:ring-2 focus:ring-sg/20 disabled:opacity-50"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
              />
              <button
                onClick={() => { if (textInput.trim()) { send(textInput); setTextInput(''); } }}
                disabled={!textInput.trim() || isLoading || completing}
                className="flex-shrink-0 rounded-xl bg-sg p-2.5 text-white hover:bg-sg-hover disabled:opacity-40 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-center text-[10px] text-slate-400">
              Claude Opus 4.6 · AWS Bedrock eu-west-2 · TOGAF · DAMA-DMBOK · FAIR · Enter to send
            </p>
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════
          RIGHT: Intelligence panel
      ════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-[300px] xl:w-[320px] flex-shrink-0 border-l border-slate-200 bg-white overflow-y-auto">

        {/* Live report summary */}
        <div className="px-4 py-4 border-b border-slate-100 bg-sg-light">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-sg">Assessment progress</p>
            <span className={`text-xs font-semibold ${confidenceColour}`}>
              {liveReport.report_confidence} confidence
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/60">
            <div className="h-full rounded-full bg-sg transition-all duration-700" style={{ width: `${liveReport.report_completeness}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-sg/70">Report completeness</span>
            <span className="text-[10px] font-bold text-sg">{liveReport.report_completeness}%</span>
          </div>
          {liveReport.current_state_summary && (
            <p className="mt-2 text-xs text-sg-text/80 leading-4 italic">{liveReport.current_state_summary}</p>
          )}
        </div>

        {/* Insight feed */}
        {feedItems.length > 0 && (
          <div className="px-3 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-sg-text mb-2 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-sg" /> Insight feed
            </p>
            <div className="space-y-1.5">
              {feedItems
                .sort((a, b) => (SEVERITY_ORDER[a.severity ?? 'low'] ?? 2) - (SEVERITY_ORDER[b.severity ?? 'low'] ?? 2))
                .slice(0, 8)
                .map((item, i) => {
                  const s = FEED_STYLE[item.type];
                  return (
                    <div key={i} className={`flex gap-2 rounded-lg border px-2.5 py-1.5 ${s.bg}`}>
                      <span className="text-[10px] leading-4 flex-shrink-0">{s.icon}</span>
                      <p className="text-[10px] text-sg-text leading-4">{item.text}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Domain coverage */}
        <div className="px-3 py-3 border-b border-slate-100">
          <p className="text-xs font-bold text-sg-text mb-2">Domain coverage</p>
          <div className="space-y-1">
            {(Object.keys(DOMAIN_META) as (keyof DomainProgress)[]).map(key => (
              <DomainRow
                key={key} domainKey={key}
                label={DOMAIN_META[key].label} Icon={DOMAIN_META[key].Icon}
                progress={progress[key]} confidence={confidence[key]}
                active={currentDomain === key}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[9px] text-slate-400">♦ = assessment confidence</p>
        </div>

        {/* FAIR scores */}
        <div className="px-3 py-3 border-b border-slate-100">
          <p className="text-xs font-bold text-sg-text mb-2">FAIR assessment</p>
          <div className="space-y-2.5">
            {([['findable', 'Findable'], ['accessible', 'Accessible'], ['interoperable', 'Interoperable'], ['reusable', 'Reusable']] as const).map(([k, l]) => (
              <div key={k}>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-slate-600">{l}</span>
                  <span className="text-[10px] font-bold text-slate-700">{fair[k]}%</span>
                </div>
                <MiniBar value={fair[k]} colour="bg-violet-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Standards alignment */}
        <div className="px-3 py-3 border-b border-slate-100">
          <p className="text-xs font-bold text-sg-text mb-2">Standards alignment</p>
          <div className="space-y-2.5">
            {([['dcat', 'DCAT-AP 3'], ['metadata_completeness', 'Metadata'], ['governance_maturity', 'Governance']] as const).map(([k, l]) => (
              <div key={k}>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-slate-600">{l}</span>
                  <span className="text-[10px] font-bold text-slate-700">{standards[k]}%</span>
                </div>
                <MiniBar value={standards[k]} colour="bg-sg" />
              </div>
            ))}
          </div>
        </div>

        {/* Patterns detected */}
        {patterns.length > 0 && (
          <div className="px-3 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-sg-text mb-2 flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-sg" /> Patterns detected
            </p>
            <div className="flex flex-wrap gap-1.5">
              {patterns.map(p => (
                <span key={p} className="rounded-full border border-sg/30 bg-sg-light px-2 py-0.5 text-[10px] font-semibold text-sg">{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Top risks */}
        {liveReport.top_risks.length > 0 && (
          <div className="px-3 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-sg-text mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-sg-danger" /> Top risks
            </p>
            <ul className="space-y-1.5">
              {liveReport.top_risks.slice(0, 4).map((r, i) => (
                <li key={i} className="flex gap-1.5 text-[10px] text-slate-600 leading-4">
                  <span className="text-sg-danger font-bold flex-shrink-0">·</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Benchmarking */}
        {benchmarking && (
          <div className="px-3 py-3">
            <p className="text-xs font-bold text-sg-text mb-1 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-sg" /> Benchmarking
            </p>
            <p className="text-[10px] text-slate-600 leading-4 italic">{benchmarking}</p>
          </div>
        )}
      </aside>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Bot, Building2, Database, FileCheck2, Globe,
  Lock, BarChart2, Wrench, DollarSign, Loader2, Send,
} from 'lucide-react';
import {
  sendAssessmentMessage,
  DEFAULT_DOMAIN_PROGRESS,
  DEFAULT_FAIR,
  DEFAULT_STANDARDS,
} from '../services/aiService';
import type {
  AssessmentTurn, ChatMessage, DomainProgress, FairScores, StandardsAlignment,
} from '../services/aiService';
import type { AssessmentResult } from '../types';

interface Props {
  onComplete: (result: AssessmentResult) => void;
  onBack: () => void;
  onTraditional: () => void;
}

interface ConversationTurn {
  userMessage: string;
  response: AssessmentTurn;
}

const LOADING_PHASES = [
  'Analysing your response…',
  'Identifying architectural gaps…',
  'Preparing next question…',
];

const DOMAIN_META: Record<keyof DomainProgress, { label: string; Icon: typeof Bot }> = {
  business_goals: { label: 'Business goals',   Icon: Building2  },
  data_sources:   { label: 'Data sources',      Icon: Database   },
  architecture:   { label: 'Architecture',      Icon: Globe      },
  governance:     { label: 'Governance',        Icon: FileCheck2 },
  security:       { label: 'Security',          Icon: Lock       },
  analytics:      { label: 'Analytics',         Icon: BarChart2  },
  operations:     { label: 'Operations',        Icon: Wrench     },
  cost:           { label: 'Cost',              Icon: DollarSign },
};

function ProgressBar({ value, colour }: { value: number; colour: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${colour}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function ScoreRow({ label, value, colour }: { label: string; value: number; colour: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-slate-600">{label}</span>
        <span className="text-xs font-semibold text-slate-700">{value}%</span>
      </div>
      <ProgressBar value={value} colour={colour} />
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
  const base = 'rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  if (interaction.type === 'yes_no' || interaction.type === 'true_false') {
    const [a, b] = interaction.type === 'yes_no' ? ['Yes', 'No'] : ['True', 'False'];
    return (
      <div className="flex gap-2 mt-3">
        <button disabled={disabled} onClick={() => onAnswer(a)}
          className={`${base} border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100`}>{a}</button>
        <button disabled={disabled} onClick={() => onAnswer(b)}
          className={`${base} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>{b}</button>
      </div>
    );
  }
  if (interaction.type === 'multiple_choice' && interaction.options?.length) {
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {interaction.options.map(opt => (
          <button key={opt} disabled={disabled} onClick={() => onAnswer(opt)}
            className={`${base} border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100`}>
            {opt}
          </button>
        ))}
      </div>
    );
  }
  return null;
}

export function AssessmentChatPage({ onComplete, onBack, onTraditional }: Props) {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<DomainProgress>(DEFAULT_DOMAIN_PROGRESS);
  const [fair, setFair] = useState<FairScores>(DEFAULT_FAIR);
  const [standards, setStandards] = useState<StandardsAlignment>(DEFAULT_STANDARDS);
  const [currentDomain, setCurrentDomain] = useState('');
  const [completing, setCompleting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!hasStarted.current) { hasStarted.current = true; send(''); }
  }, []);

  useEffect(() => {
    if (!isLoading) { setLoadingPhase(0); return; }
    const t1 = setTimeout(() => setLoadingPhase(1), 2200);
    const t2 = setTimeout(() => setLoadingPhase(2), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isLoading]);

  function scroll() { setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60); }

  async function send(userMessage: string) {
    if (isLoading) return;
    setError('');
    setIsLoading(true);

    const history: ChatMessage[] = turns.flatMap(t => {
      const msgs: ChatMessage[] = [];
      if (t.userMessage) msgs.push({ role: 'user', content: t.userMessage });
      msgs.push({ role: 'assistant', content: JSON.stringify(t.response) });
      return msgs;
    });

    scroll();

    try {
      const response = await sendAssessmentMessage(userMessage, history);
      setTurns(prev => [...prev, { userMessage, response }]);
      setProgress(response.assessment_progress);
      setFair(response.fair_scores);
      setStandards(response.standards_alignment);
      setCurrentDomain(response.domain);
      scroll();

      if (response.is_complete && response.result) {
        setCompleting(true);
        setTimeout(() => onComplete(response.result!), 1800);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleAnswer(value: string) { send(value); }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (textInput.trim()) send(textInput); }
  }

  const lastTurn = turns[turns.length - 1];
  const needsTextInput = !isLoading && lastTurn?.response.interaction.type === 'open_text' && !lastTurn.response.is_complete;
  const overallProgress = Math.round(Object.values(progress).reduce((a, b) => a + b, 0) / 8);

  return (
    <div className="flex h-screen overflow-hidden bg-mist">

      {/* ── Left: Chat panel ─────────────────────────────── */}
      <div className="flex flex-col w-full lg:w-[58%] border-r border-slate-200 bg-white">

        {/* Header */}
        <header className="flex-shrink-0 border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-ink transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-ink">AI Architecture Assessment</span>
                <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{overallProgress}% complete</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-teal transition-all duration-700" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">

          {/* Intro banner */}
          {turns.length === 0 && !isLoading && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              <p className="font-semibold">TOGAF · DAMA-DMBOK · FAIR · DCAT-AP 3</p>
              <p className="mt-0.5 text-xs text-teal-700">Vendor-neutral enterprise assessment · UK government standards aligned</p>
              <button onClick={onTraditional} className="mt-1.5 text-xs text-teal-600 underline underline-offset-2 hover:text-teal-900">
                Prefer the traditional questionnaire?
              </button>
            </div>
          )}

          {/* Conversation turns */}
          {turns.map((turn, i) => {
            const isLast = i === turns.length - 1;
            const { response } = turn;
            return (
              <div key={i} className="space-y-3">
                {/* User bubble (skip empty first-turn trigger) */}
                {turn.userMessage && (
                  <div className="flex justify-end">
                    <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-teal px-4 py-2.5 text-sm text-white leading-6">
                      {turn.userMessage}
                    </div>
                  </div>
                )}

                {/* Alex insight bubble */}
                <div className="flex gap-2.5">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-ink flex items-center justify-center mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 leading-6 shadow-sm">
                      <p>{response.insight}</p>
                      {response.implication && (
                        <p className="mt-1.5 text-xs text-slate-500 italic border-t border-slate-100 pt-1.5">{response.implication}</p>
                      )}
                    </div>

                    {/* Question + interaction widget */}
                    {response.interaction.type !== 'none' && response.interaction.question && (
                      <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                        <p className="text-sm font-semibold text-ink">{response.interaction.question}</p>
                        {isLast && (
                          <InteractionWidget
                            interaction={response.interaction}
                            onAnswer={handleAnswer}
                            disabled={isLoading || completing}
                          />
                        )}
                      </div>
                    )}

                    {/* Completion message */}
                    {response.is_complete && (
                      <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                        Generating your full assessment report…
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading state */}
          {isLoading && (
            <div className="flex gap-2.5">
              <div className="flex-shrink-0 h-7 w-7 rounded-full bg-ink flex items-center justify-center mt-0.5">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-teal flex-shrink-0" />
                  {LOADING_PHASES[loadingPhase]}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error} —{' '}
              <button onClick={() => send('')} className="font-semibold underline">retry</button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Text input (only for open_text turns) */}
        {(needsTextInput || turns.length === 0) && (
          <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type your response…"
                rows={2}
                disabled={isLoading || completing}
                className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:opacity-50"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
              />
              <button
                onClick={() => { if (textInput.trim()) send(textInput); }}
                disabled={!textInput.trim() || isLoading || completing}
                className="flex-shrink-0 rounded-xl bg-teal p-2.5 text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-center text-[10px] text-slate-400">
              Claude Opus 4.6 · AWS Bedrock eu-west-2 · Enter to send
            </p>
          </div>
        )}
      </div>

      {/* ── Right: Insights panel ────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[42%] overflow-y-auto bg-slate-50 border-l border-slate-200 px-5 py-5 gap-6">

        {/* Domain coverage */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Domain coverage</h3>
          <div className="space-y-3">
            {(Object.keys(DOMAIN_META) as (keyof DomainProgress)[]).map(key => {
              const { label, Icon } = DOMAIN_META[key];
              const val = progress[key];
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3 text-slate-400" />
                      <span className={`text-xs ${currentDomain === key ? 'font-bold text-teal' : 'text-slate-600'}`}>{label}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{val}%</span>
                  </div>
                  <ProgressBar value={val} colour={val >= 65 ? 'bg-teal' : val > 30 ? 'bg-teal/60' : 'bg-slate-300'} />
                </div>
              );
            })}
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* FAIR scores */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">FAIR assessment</h3>
          <div className="space-y-3">
            <ScoreRow label="Findable"       value={fair.findable}      colour="bg-violet-500" />
            <ScoreRow label="Accessible"     value={fair.accessible}    colour="bg-violet-500" />
            <ScoreRow label="Interoperable"  value={fair.interoperable} colour="bg-violet-500" />
            <ScoreRow label="Reusable"       value={fair.reusable}      colour="bg-violet-500" />
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* Standards alignment */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Standards alignment</h3>
          <div className="space-y-3">
            <ScoreRow label="DCAT-AP 3"             value={standards.dcat}                 colour="bg-blue-500" />
            <ScoreRow label="Metadata completeness"  value={standards.metadata_completeness} colour="bg-blue-500" />
            <ScoreRow label="Governance maturity"    value={standards.governance_maturity}   colour="bg-blue-500" />
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* Status */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Status</h3>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Questions asked</span>
              <span className="font-semibold">{turns.filter(t => t.userMessage).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Overall progress</span>
              <span className="font-semibold">{overallProgress}%</span>
            </div>
            {currentDomain && (
              <div className="flex justify-between">
                <span>Current domain</span>
                <span className="font-semibold capitalize">{DOMAIN_META[currentDomain as keyof DomainProgress]?.label ?? currentDomain}</span>
              </div>
            )}
          </div>
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500 leading-5">
            Vendor-neutral · Open-source first · TOGAF · DAMA-DMBOK · UK Gov standards
          </div>
        </section>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, Wrench, Target } from 'lucide-react';
import { generateRoadmap } from '../services/aiService';
import type { AIRoadmap } from '../services/aiService';
import type { AssessmentResult } from '../types';

interface AIRoadmapProps {
  result: AssessmentResult;
}

type State = 'idle' | 'loading' | 'done' | 'error';

const PHASE_COLOURS = [
  'border-emerald-300 bg-emerald-50',
  'border-blue-300 bg-blue-50',
  'border-violet-300 bg-violet-50',
];
const PHASE_LABEL_COLOURS = ['text-emerald-700', 'text-blue-700', 'text-violet-700'];

export function AIRoadmap({ result }: AIRoadmapProps) {
  const [state, setState] = useState<State>('idle');
  const [roadmap, setRoadmap] = useState<AIRoadmap | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setState('loading');
    setError('');
    try {
      const data = await generateRoadmap(result);
      setRoadmap(data);
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600" />
          <h3 className="text-lg font-bold text-ink">AI-generated roadmap</h3>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
            Personalised · Claude Opus 4.6
          </span>
        </div>
        {(state === 'done' || state === 'error') && (
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Regenerate
          </button>
        )}
      </div>

      {state === 'loading' && (
        <div className="grid gap-4 md:grid-cols-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-md border border-slate-200 p-4 space-y-3">
              <div className="h-3 rounded bg-slate-200 w-1/3" />
              <div className="h-5 rounded bg-slate-200 w-2/3" />
              <div className="h-3 rounded bg-slate-200 w-full" />
              <div className="h-3 rounded bg-slate-200 w-5/6" />
              <div className="h-3 rounded bg-slate-200 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {state === 'done' && roadmap && (
        <div className="grid gap-4 md:grid-cols-3">
          {roadmap.phases.map((phase, i) => (
            <div key={phase.phase} className={`rounded-md border p-4 ${PHASE_COLOURS[i] ?? 'border-slate-200 bg-white'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide ${PHASE_LABEL_COLOURS[i] ?? 'text-slate-600'}`}>
                {phase.phase}
              </p>
              <h4 className="mt-1.5 text-base font-bold text-ink">{phase.title}</h4>
              <p className="mt-1 text-xs text-slate-500 italic">{phase.theme}</p>

              <ul className="mt-3 space-y-1.5">
                {phase.actions.map(action => (
                  <li key={action} className="flex gap-2 text-sm text-slate-700">
                    <span className="mt-0.5 flex-shrink-0 text-slate-400">→</span>
                    {action}
                  </li>
                ))}
              </ul>

              {phase.tools.length > 0 && (
                <div className="mt-3 flex items-center gap-1.5">
                  <Wrench className="h-3 w-3 text-slate-400 flex-shrink-0" />
                  <p className="text-xs font-semibold text-slate-600">{phase.tools.join(', ')}</p>
                </div>
              )}

              <div className="mt-3 flex items-start gap-1.5 rounded-md bg-white/60 px-2.5 py-2">
                <Target className="h-3 w-3 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-5">{phase.outcome}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 p-4">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Could not generate AI roadmap</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

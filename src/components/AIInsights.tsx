import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { generateNarrative } from '../services/aiService';
import type { AssessmentResult, Answers } from '../types';

interface AIInsightsProps {
  result: AssessmentResult;
  answers: Answers;
}

type State = 'idle' | 'loading' | 'done' | 'error';

export function AIInsights({ result, answers }: AIInsightsProps) {
  const [state, setState] = useState<State>('idle');
  const [narrative, setNarrative] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setState('loading');
    setError('');
    try {
      const text = await generateNarrative(result, answers);
      setNarrative(text);
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  }

  useEffect(() => { load(); }, []); // auto-load on mount

  return (
    <div className="rounded-md border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 shadow-panel">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600" />
          <h3 className="text-lg font-bold text-ink">AI executive analysis</h3>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
            Claude Opus · AWS Bedrock
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
        <div className="space-y-3 animate-pulse">
          <div className="h-4 rounded bg-violet-200 w-full" />
          <div className="h-4 rounded bg-violet-200 w-5/6" />
          <div className="h-4 rounded bg-violet-200 w-4/5" />
          <div className="h-4 rounded bg-violet-200 w-full mt-4" />
          <div className="h-4 rounded bg-violet-200 w-3/4" />
          <p className="text-xs text-violet-500 mt-2">Analysing your results with Claude Opus…</p>
        </div>
      )}

      {state === 'done' && (
        <div className="prose prose-sm max-w-none text-slate-700 leading-7 space-y-4">
          {narrative.split('\n\n').filter(Boolean).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 p-4">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Could not generate AI analysis</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <p className="text-xs text-red-500 mt-2">
              Check that the EC2 instance IAM role has <code>bedrock:InvokeModel</code> permission
              and that the model is enabled in eu-west-2.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

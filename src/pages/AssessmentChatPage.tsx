import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bot, Loader2, Send, User } from 'lucide-react';
import { streamAssessmentChat } from '../services/aiService';
import type { ChatMessage } from '../services/aiService';
import type { AssessmentResult } from '../types';

const COMPLETION_MARKER = '[ASSESSMENT_COMPLETE]';
const EXPECTED_TURNS = 13;

interface AssessmentChatPageProps {
  onComplete: (result: AssessmentResult) => void;
  onBack: () => void;
  onTraditional: () => void;
}

type Phase = 'chat' | 'extracting' | 'error';

export function AssessmentChatPage({ onComplete, onBack, onTraditional }: AssessmentChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [phase, setPhase] = useState<Phase>('chat');
  const [errorText, setErrorText] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      runTurn('');
    }
  }, []);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function extractResult(jsonText: string) {
    try {
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON found in response');
      const result: AssessmentResult = JSON.parse(match[0]);
      if (!result.dimensionScores || result.dimensionScores.length !== 19) {
        throw new Error('Incomplete assessment result — missing dimension scores');
      }
      onComplete(result);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Could not parse assessment result');
      setPhase('error');
    }
  }

  async function runTurn(userMessage: string) {
    if (streaming || phase !== 'chat') return;

    const history = [...messages];

    if (userMessage.trim()) {
      const userMsg: ChatMessage = { role: 'user', content: userMessage.trim() };
      setMessages(prev => [...prev, userMsg]);
      history.push(userMsg);
      setInput('');
      setTurnCount(t => t + 1);
    }

    setStreaming(true);
    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);
    setTimeout(scrollToBottom, 50);

    let fullText = '';

    try {
      for await (const chunk of streamAssessmentChat(userMessage, history)) {
        fullText += chunk;

        const markerIdx = fullText.indexOf(COMPLETION_MARKER);
        const displayText = markerIdx === -1
          ? fullText
          : fullText.substring(0, markerIdx).trim();

        assistantMsg.content = displayText;
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { ...assistantMsg };
          return next;
        });
        scrollToBottom();
      }

      // Stream finished — check for completion
      const markerIdx = fullText.indexOf(COMPLETION_MARKER);
      if (markerIdx !== -1) {
        setPhase('extracting');
        extractResult(fullText.substring(markerIdx + COMPLETION_MARKER.length));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      assistantMsg.content = `Sorry, I encountered an error: ${msg}`;
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { ...assistantMsg };
        return next;
      });
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleSend() {
    if (input.trim() && !streaming && phase === 'chat') {
      runTurn(input);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const progress = phase === 'extracting'
    ? 100
    : Math.min(Math.round((turnCount / EXPECTED_TURNS) * 95), 95);

  const userMessages = messages.filter(m => m.role === 'user').length;

  return (
    <main className="flex h-screen flex-col bg-mist">

      {/* Header */}
      <header className="flex-shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-ink truncate">
                AI Assessment Interview
              </p>
              <span className="ml-2 flex-shrink-0 text-xs text-slate-400">
                {phase === 'extracting' ? 'Generating report…' : `~${Math.max(0, EXPECTED_TURNS - turnCount)} questions remaining`}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-teal transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">

          {/* Intro banner — only before first message */}
          {messages.length === 0 && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm text-teal-800">
              <p className="font-semibold">AI-powered assessment interview</p>
              <p className="mt-1 text-teal-700">
                Claude Opus 4.6 will ask you questions about your data architecture across 19 dimensions and generate a full maturity report.
                Typically takes 10–15 exchanges.
              </p>
              <button
                onClick={onTraditional}
                className="mt-2 text-xs text-teal-600 underline underline-offset-2 hover:text-teal-800"
              >
                Prefer the traditional questionnaire?
              </button>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                msg.role === 'assistant' ? 'bg-teal text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {msg.role === 'assistant'
                  ? <Bot className="h-4 w-4" />
                  : <User className="h-4 w-4" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                msg.role === 'assistant'
                  ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                  : 'bg-teal text-white rounded-tr-sm'
              }`}>
                {msg.content || (
                  <span className="flex gap-1 items-center text-slate-400">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce [animation-delay:0.15s]">●</span>
                    <span className="animate-bounce [animation-delay:0.3s]">●</span>
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Extracting overlay */}
          {phase === 'extracting' && (
            <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-5 py-4">
              <Loader2 className="h-5 w-5 text-violet-600 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-violet-800">Generating your assessment report…</p>
                <p className="text-xs text-violet-600 mt-0.5">
                  Scoring {userMessages > 0 ? userMessages : 'your'} responses across 19 dimensions
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {phase === 'error' && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-sm font-semibold text-red-800">Could not generate report</p>
              <p className="text-sm text-red-600 mt-1">{errorText}</p>
              <button
                onClick={() => { setPhase('chat'); runTurn('Please regenerate the assessment JSON.'); }}
                className="mt-3 text-xs font-semibold text-red-700 underline"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={phase === 'chat' && !streaming ? 'Type your response…' : ''}
              rows={1}
              disabled={streaming || phase !== 'chat'}
              className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:opacity-50"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming || phase !== 'chat'}
              className="flex-shrink-0 rounded-xl bg-teal p-2.5 text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-slate-400">
            Claude Opus 4.6 · AWS Bedrock · eu-west-2 · Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>

    </main>
  );
}

import { useRef, useState } from 'react';
import { MessageSquare, X, Send, Sparkles, ChevronDown } from 'lucide-react';
import { streamChat } from '../services/aiService';
import type { ChatMessage } from '../services/aiService';
import type { AssessmentResult } from '../types';

interface AIChatProps {
  result: AssessmentResult;
}

export function AIChat({ result }: AIChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const STARTERS = [
    'What should I prioritise first?',
    'How do I improve my governance score?',
    'Which AWS services would help most?',
    'What does reaching Level 4 require?',
  ];

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function send(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || streaming) return;

    const userMsg: ChatMessage = { role: 'user', content: userText };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setStreaming(true);

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      for await (const chunk of streamChat(userText, result, messages)) {
        assistantMsg.content += chunk;
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { ...assistantMsg };
          return next;
        });
        scrollToBottom();
      }
    } catch (err) {
      assistantMsg.content = `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}`;
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

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-violet-600 px-4 py-3 text-white shadow-lg hover:bg-violet-700 transition-colors print:hidden"
        aria-label="Toggle AI chat"
      >
        {open ? <ChevronDown className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
        <span className="text-sm font-semibold">{open ? 'Close chat' : 'Ask Claude'}</span>
        <Sparkles className="h-4 w-4 opacity-75" />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-40 flex w-96 max-w-[calc(100vw-3rem)] flex-col rounded-xl border border-slate-200 bg-white shadow-2xl print:hidden"
             style={{ height: '520px' }}>

          {/* Header */}
          <div className="flex items-center justify-between gap-3 rounded-t-xl border-b border-slate-200 bg-violet-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-200" />
              <span className="text-sm font-semibold text-white">Ask Claude about your results</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-violet-200 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 text-center">
                  Claude Opus 4.6 knows your assessment scores. Ask anything about your results.
                </p>
                <div className="space-y-2">
                  {STARTERS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-left text-xs text-violet-800 hover:bg-violet-100 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                }`}>
                  {msg.content || (
                    <span className="flex gap-1 items-center text-slate-400">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce [animation-delay:0.1s]">●</span>
                      <span className="animate-bounce [animation-delay:0.2s]">●</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-3">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about your results…"
                rows={1}
                disabled={streaming}
                className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
                style={{ maxHeight: '100px', overflowY: 'auto' }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                className="flex-shrink-0 rounded-lg bg-violet-600 p-2 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-slate-400">
              Claude Opus 4.6 · AWS Bedrock · eu-west-2 · Enter to send
            </p>
          </div>
        </div>
      )}
    </>
  );
}

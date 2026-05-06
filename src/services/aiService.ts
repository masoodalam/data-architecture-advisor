import type { AssessmentResult, Answers } from '../types';

const API_BASE = '/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RoadmapPhase {
  phase: string;
  title: string;
  theme: string;
  actions: string[];
  tools: string[];
  outcome: string;
}

export interface AIRoadmap {
  phases: RoadmapPhase[];
}

// ─── Narrative ────────────────────────────────────────────────────────────────

export async function generateNarrative(
  result: AssessmentResult,
  answers: Answers,
): Promise<string> {
  const res = await fetch(`${API_BASE}/narrative`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result, answers }),
  });
  if (!res.ok) throw new Error(`Narrative API error: ${res.status}`);
  const data = await res.json();
  return data.narrative as string;
}

// ─── Roadmap ──────────────────────────────────────────────────────────────────

export async function generateRoadmap(result: AssessmentResult): Promise<AIRoadmap> {
  const res = await fetch(`${API_BASE}/roadmap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result }),
  });
  if (!res.ok) throw new Error(`Roadmap API error: ${res.status}`);
  return res.json() as Promise<AIRoadmap>;
}

// ─── Assessment interview chat ────────────────────────────────────────────────

export async function* streamAssessmentChat(
  message: string,
  history: ChatMessage[],
): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}/assess/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error(`Assessment API error: ${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === 'delta') yield event.text as string;
        if (event.type === 'error') throw new Error(event.error);
        if (event.type === 'done') return;
      } catch { /* skip malformed */ }
    }
  }
}

// ─── Streaming chat ───────────────────────────────────────────────────────────

export async function* streamChat(
  message: string,
  result: AssessmentResult,
  history: ChatMessage[],
): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, result, history }),
  });

  if (!res.ok) throw new Error(`Chat API error: ${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === 'delta') yield event.text as string;
        if (event.type === 'error') throw new Error(event.error);
        if (event.type === 'done') return;
      } catch {
        // skip malformed lines
      }
    }
  }
}

const API_BASE = '/api';

export interface GapItem {
  category: string;
  label: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  finding: string;
  recommendation: string;
  tools: string[];
  score: number;
}

export interface ClarifyingQuestion {
  id: string;
  category: string;
  question: string;
  type: 'yes_no' | 'multiple_choice' | 'open_text';
  options: string[];
  priority: 'high' | 'medium' | 'low';
  answered?: boolean;
}

export interface FairScores {
  findable: number;
  accessible: number;
  interoperable: number;
  reusable: number;
}

export interface StandardsAlignment {
  dcat: number;
  metadata_completeness: number;
  governance_maturity: number;
}

export interface GapAnalysis {
  summary: string;
  architecture_type: string;
  maturity_score: number;
  maturity_classification: string;
  gaps: GapItem[];
  strengths: string[];
  fair_scores: FairScores;
  standards_alignment: StandardsAlignment;
  clarifying_questions: ClarifyingQuestion[];
  report_readiness: number;
}

export async function analyseArchitecture(
  imageBase64: string,
  mimeType: string,
  context: string,
): Promise<GapAnalysis> {
  const res = await fetch(`${API_BASE}/gap/analyse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType, context }),
  });
  if (!res.ok) throw new Error(`Gap analysis API error: ${res.status}`);
  return res.json() as Promise<GapAnalysis>;
}

export async function refineAnalysis(
  analysis: GapAnalysis,
  questionId: string,
  question: string,
  answer: string,
): Promise<GapAnalysis> {
  const res = await fetch(`${API_BASE}/gap/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis, questionId, question, answer }),
  });
  if (!res.ok) throw new Error(`Gap refine API error: ${res.status}`);
  return res.json() as Promise<GapAnalysis>;
}

export async function* streamGapReport(analysis: GapAnalysis): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}/gap/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis }),
  });
  if (!res.ok) throw new Error(`Gap report API error: ${res.status}`);

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

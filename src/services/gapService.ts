const API_BASE = '/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export type JobStatus =
  | 'pending'
  | 'processing'
  | 'needs_clarification'
  | 'generating_report'
  | 'completed'
  | 'failed'
  | 'retrying';

export interface JobStep {
  name:   string;
  status: 'active' | 'done' | 'failed';
  detail: string;
  ts:     number;
}

export interface Stage1Result {
  architecture_type:   string;
  components:          string[];
  data_flows:          string[];
  initial_maturity:    number;
  visible_strengths:   string[];
  immediate_concerns:  string[];
}

export interface GapItem {
  category:       string;
  label:          string;
  severity:       'critical' | 'high' | 'medium' | 'low';
  finding:        string;
  recommendation: string;
  tools:          string[];
  score:          number;
}

export interface ClarifyingQuestion {
  id:       string;
  category: string;
  question: string;
  type:     'yes_no' | 'multiple_choice' | 'open_text';
  options:  string[];
  priority: 'high' | 'medium' | 'low';
  answered?: boolean;
}

export interface FairScores {
  findable:      number;
  accessible:    number;
  interoperable: number;
  reusable:      number;
}

export interface StandardsAlignment {
  dcat:                   number;
  metadata_completeness:  number;
  governance_maturity:    number;
}

export interface GapAnalysis {
  summary:                 string;
  architecture_type:       string;
  maturity_score:          number;
  maturity_classification: string;
  gaps:                    GapItem[];
  strengths:               string[];
  fair_scores:             FairScores;
  standards_alignment:     StandardsAlignment;
  clarifying_questions:    ClarifyingQuestion[];
  report_readiness:        number;
}

export interface JobAnswer {
  questionId: string;
  question:   string;
  answer:     string;
  ts:         number;
}

export interface GapJob {
  id:         string;
  status:     JobStatus;
  progress:   number;
  steps:      JobStep[];
  components: Stage1Result | null;
  analysis:   GapAnalysis  | null;
  answers:    JobAnswer[];
  report:     string | null;
  error:      string | null;
  mimeType:   string;
  createdAt:  number;
  updatedAt:  number;
}

// ── API functions ──────────────────────────────────────────────────────────────

export async function createJob(
  imageBase64: string,
  mimeType: string,
  context: string,
): Promise<{ jobId: string }> {
  const res = await fetch(`${API_BASE}/gap/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType, context }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `Upload failed (${res.status})`);
  }
  return res.json();
}

export async function fetchJob(jobId: string): Promise<GapJob> {
  const res = await fetch(`${API_BASE}/gap/jobs/${jobId}`);
  if (!res.ok) throw new Error(`Job not found`);
  return res.json();
}

export async function listJobs(): Promise<GapJob[]> {
  const res = await fetch(`${API_BASE}/gap/jobs`);
  if (!res.ok) return [];
  return res.json();
}

export async function submitAnswer(
  jobId: string,
  questionId: string,
  question: string,
  answer: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/gap/jobs/${jobId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, question, answer }),
  });
  if (!res.ok) throw new Error('Failed to submit answer');
}

export async function triggerReport(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/gap/jobs/${jobId}/report`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start report generation');
}

export async function retryJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/gap/jobs/${jobId}/retry`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to retry job');
}

export function filePreviewUrl(jobId: string): string {
  return `${API_BASE}/gap/jobs/${jobId}/file`;
}

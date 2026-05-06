import { readFileSync } from 'fs';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import db from './db.js';

const REGION   = process.env.AWS_REGION       ?? 'eu-west-2';
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-opus-4-6-v1';
const bedrock  = new BedrockRuntimeClient({ region: REGION });
const IMAGE_TYPES = new Set(['image/png','image/jpeg','image/jpg','image/gif','image/webp']);

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── DB helpers ─────────────────────────────────────────────────────────────────

function getJob(id) {
  return db.prepare('SELECT * FROM gap_jobs WHERE id = ?').get(id);
}

function patch(id, obj) {
  const sets = Object.keys(obj).map(k => `${k} = ?`).join(', ');
  const vals = Object.values(obj).map(v => (v !== null && typeof v === 'object') ? JSON.stringify(v) : v);
  db.prepare(`UPDATE gap_jobs SET ${sets}, updated_at = ? WHERE id = ?`).run(...vals, Date.now(), id);
}

function setStep(id, name, status, detail = '') {
  const job = getJob(id);
  if (!job) return;
  const steps = JSON.parse(job.steps);
  steps.forEach(s => { if (s.status === 'active') s.status = 'done'; });
  const existing = steps.findIndex(s => s.name === name);
  const entry = { name, status, detail, ts: Date.now() };
  if (existing >= 0) steps[existing] = entry; else steps.push(entry);
  const progress = Math.min((steps.filter(s => s.status === 'done').length * 9) + 5, 75);
  db.prepare('UPDATE gap_jobs SET steps = ?, progress = ?, updated_at = ? WHERE id = ?')
    .run(JSON.stringify(steps), progress, Date.now(), id);
}

// ── Bedrock with retry + backoff ───────────────────────────────────────────────

async function invoke(cmd, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try { return await bedrock.send(cmd); }
    catch (err) {
      if (i === attempts) throw err;
      await sleep(Math.pow(2, i) * 1500);
    }
  }
}

// ── File content extraction ────────────────────────────────────────────────────

async function readFile(filePath, mimeType) {
  const buf = readFileSync(filePath);
  if (IMAGE_TYPES.has(mimeType)) {
    return { type: 'image', buf, format: mimeType.split('/')[1] ?? 'png' };
  }
  if (mimeType === 'application/pdf') {
    const r = await pdfParse(buf);
    return { type: 'text', text: r.text };
  }
  const r = await mammoth.extractRawText({ buffer: buf });
  return { type: 'text', text: r.value };
}

function buildUserContent(file, extra = '') {
  if (file.type === 'image') {
    const content = [{ image: { format: file.format, source: { bytes: file.buf } } }];
    if (extra) content.push({ text: extra });
    return content;
  }
  return [{ text: `${file.text.slice(0, 60000)}${file.text.length > 60000 ? '\n[truncated]' : ''}${extra ? '\n\n' + extra : ''}` }];
}

function parseJSON(raw) {
  const m = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : raw);
}

// ── System prompts ─────────────────────────────────────────────────────────────

const PERSONA = `You are a senior enterprise data architect (TOGAF 9.2, DAMA-DMBOK 2, UK GDS, FAIR, DCAT-AP 3, Cyber Essentials Plus, ISO 27001). Output ONLY valid JSON — no markdown fences, no prose outside JSON.`;

const STAGE1_SYS = `${PERSONA}

Quick scan: identify the main components and architecture pattern.
Return ONLY:
{"architecture_type":"Data Warehouse|Data Lake|Lakehouse|Data Mesh|Hub and Spoke|Event Streaming|Microservices|Lambda|Kappa|Hybrid|Unknown","components":["..."],"data_flows":["..."],"initial_maturity":<1.0-5.0>,"visible_strengths":["..."],"immediate_concerns":["..."]}`;

const STAGE2_SYS = `${PERSONA}

Full gap analysis across all 18 categories: ingestion, storage, transformation, governance, quality, security, lineage, catalogue, observability, cicd, analytics, ml_ai, cost, interoperability, cloud_portability, data_contracts, environments, operating_model.

Return ONLY:
{"summary":"2-3 sentence overview","architecture_type":"...","maturity_score":<1.0-5.0>,"maturity_classification":"Ad hoc|Developing|Managed|Advanced|Optimised","gaps":[{"category":"<key>","label":"<label>","severity":"critical|high|medium|low","finding":"<1-2 sentences>","recommendation":"<action>","tools":["<oss>","<aws>"],"score":<1-5>}],"strengths":["..."],"fair_scores":{"findable":<0-100>,"accessible":<0-100>,"interoperable":<0-100>,"reusable":<0-100>},"standards_alignment":{"dcat":<0-100>,"metadata_completeness":<0-100>,"governance_maturity":<0-100>},"clarifying_questions":[{"id":"q1","category":"<key>","question":"<question>","type":"yes_no|multiple_choice|open_text","options":[],"priority":"high|medium|low"}],"report_readiness":<0-100>}

Rules: include ALL 18 gap categories; 3-6 clarifying questions; classification <2=Ad hoc,<3=Developing,<4=Managed,<=4.5=Advanced,>4.5=Optimised`;

const REFINE_SYS = `${PERSONA}

You have a gap analysis JSON. The user answered a clarifying question. Update the JSON — same schema, same 18 categories. Update scores, severity, FAIR/standards alignment, maturity_score, maturity_classification. Mark answered question with answered:true. Increase report_readiness. Add new questions if answer reveals more gaps.`;

const REPORT_SYS = `You are a senior enterprise data architect. Generate a comprehensive consulting-grade architecture gap report as Markdown.

Sections: # Executive Summary / ## Architecture Overview / ## Current State Assessment / ### Architecture Pattern / ### Maturity Score / ## Critical Gaps / ## High Priority Gaps / ## Improvement Roadmap / ### Phase 1: Foundations (0-3 months) / ### Phase 2: Stabilise (3-9 months) / ### Phase 3: Scale (9-18 months) / ## Tool Recommendations / ### Open Source / ### Cloud Managed Services (AWS) / ## FAIR Principles Assessment / ## Standards Alignment / ## Risk Register / ## Next Steps

Reference actual findings. Align to TOGAF ADM, DAMA-DMBOK 2, UK GDS, FAIR, DCAT-AP 3, Cyber Essentials.`;

// ── Stage 1: component scan ────────────────────────────────────────────────────

async function stage1(job) {
  const file = await readFile(job.file_path, job.mime_type);
  const context = job.context ? `Context: ${job.context}` : '';
  const response = await invoke(new ConverseCommand({
    modelId: MODEL_ID,
    system: [{ text: STAGE1_SYS }],
    messages: [{ role: 'user', content: buildUserContent(file, context || 'Identify main components, data flows, and architecture pattern.') }],
    inferenceConfig: { maxTokens: 1200, temperature: 0.2 },
  }));
  return parseJSON(response.output?.message?.content?.[0]?.text ?? '{}');
}

// ── Stage 2: full gap analysis ─────────────────────────────────────────────────

async function stage2(job, s1) {
  const file = await readFile(job.file_path, job.mime_type);
  const ctx = `Previously identified — Architecture: ${s1.architecture_type}. Components: ${(s1.components ?? []).join(', ')}. Concerns: ${(s1.immediate_concerns ?? []).join('; ')}.${job.context ? ` User context: ${job.context}` : ''}\n\nPerform full gap analysis.`;
  const response = await invoke(new ConverseCommand({
    modelId: MODEL_ID,
    system: [{ text: STAGE2_SYS }],
    messages: [{ role: 'user', content: buildUserContent(file, ctx) }],
    inferenceConfig: { maxTokens: 4000, temperature: 0.3 },
  }));
  return parseJSON(response.output?.message?.content?.[0]?.text ?? '{}');
}

// ── Main job processor ─────────────────────────────────────────────────────────

export async function processJob(id) {
  const job = getJob(id);
  if (!job) return;

  try {
    patch(id, { status: 'processing', progress: 5 });
    setStep(id, 'upload_received', 'done', 'File saved successfully');
    setStep(id, 'preparing_file',  'active', 'Validating file...');
    await sleep(400);
    setStep(id, 'preparing_file',  'done');

    // Stage 1
    setStep(id, 'reading_architecture', 'active', 'Sending to Claude...');
    const s1 = await stage1(job);
    setStep(id, 'reading_architecture',   'done');
    setStep(id, 'identifying_components', 'done', `${s1.components?.length ?? 0} components found`);
    setStep(id, 'mapping_data_flows',     'active', `${s1.data_flows?.length ?? 0} data flows detected`);
    patch(id, { components: s1, progress: 35 });
    await sleep(300);
    setStep(id, 'mapping_data_flows', 'done');

    // Stage 2
    setStep(id, 'detecting_gaps',    'active', 'Checking 18 categories...');
    const s2 = await stage2(job, s1);
    setStep(id, 'detecting_gaps',    'done');
    setStep(id, 'assessing_maturity','done', `Score: ${s2.maturity_score?.toFixed(1)} — ${s2.maturity_classification}`);
    setStep(id, 'checking_fair',     'done', `Findable:${s2.fair_scores?.findable} Accessible:${s2.fair_scores?.accessible}`);
    setStep(id, 'checking_standards','done', 'DCAT-AP 3, Cyber Essentials, ISO 27001 assessed');
    setStep(id, 'preparing_questions','done', `${s2.clarifying_questions?.length ?? 0} questions ready`);

    patch(id, { status: 'needs_clarification', analysis: s2, progress: 75 });

  } catch (err) {
    console.error(`[worker] ${id} failed:`, err.message);
    const j    = getJob(id);
    const next = (j?.retry_count ?? 0) + 1;
    if (next < 3) {
      patch(id, { status: 'retrying', retry_count: next, error: err.message });
      setTimeout(() => processJob(id), Math.pow(2, next) * 2000);
    } else {
      patch(id, { status: 'failed', error: err.message });
    }
  }
}

// ── Refine after clarifying answer ────────────────────────────────────────────

export async function refineJob(id, questionId, question, answer) {
  const job = getJob(id);
  if (!job?.analysis) return;
  try {
    const response = await invoke(new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: REFINE_SYS }],
      messages: [{
        role: 'user',
        content: [{ text: `Analysis:\n${job.analysis}\n\nQuestion (${questionId}): ${question}\nAnswer: ${answer}\n\nUpdate the JSON.` }],
      }],
      inferenceConfig: { maxTokens: 4000, temperature: 0.3 },
    }));
    const updated = parseJSON(response.output?.message?.content?.[0]?.text ?? '{}');
    patch(id, { analysis: updated });
  } catch (err) {
    console.error(`[worker] refine ${id}:`, err.message);
  }
}

// ── Report generation (streamed to DB) ────────────────────────────────────────

export async function generateReport(id) {
  const job = getJob(id);
  if (!job?.analysis) return;

  patch(id, { status: 'generating_report', progress: 80 });
  setStep(id, 'building_report', 'active', 'Generating consulting report...');

  try {
    let report = '';
    const stream = await bedrock.send(new ConverseStreamCommand({
      modelId: MODEL_ID,
      system: [{ text: REPORT_SYS }],
      messages: [{
        role: 'user',
        content: [{ text: `Analysis:\n${job.analysis}\n\nAnswers:\n${job.answers}\n\nGenerate the report.` }],
      }],
      inferenceConfig: { maxTokens: 5000, temperature: 0.4 },
    }));

    let tick = 0;
    for await (const event of stream.stream) {
      if (event.contentBlockDelta?.delta?.text) {
        report += event.contentBlockDelta.delta.text;
        tick++;
        if (tick % 40 === 0) {
          const prog = Math.min(80 + Math.floor(report.length / 120), 98);
          db.prepare('UPDATE gap_jobs SET report = ?, progress = ?, updated_at = ? WHERE id = ?')
            .run(report, prog, Date.now(), id);
        }
      }
    }

    setStep(id, 'building_report', 'done', 'Report complete');
    patch(id, { status: 'completed', report, progress: 100 });
  } catch (err) {
    console.error(`[worker] report ${id}:`, err.message);
    patch(id, { status: 'failed', error: `Report generation failed: ${err.message}` });
  }
}

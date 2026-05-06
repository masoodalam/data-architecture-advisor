import { Router } from 'express';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

export const gapRouter = Router();

const REGION   = process.env.AWS_REGION       ?? 'eu-west-2';
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-opus-4-6-v1';
const bedrock  = new BedrockRuntimeClient({ region: REGION });

// ─── File type helpers ─────────────────────────────────────────────────────────

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);

function isImage(mimeType) {
  return IMAGE_TYPES.has(mimeType);
}

async function extractText(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    const result = await pdfParse(buffer);
    return result.text;
  }
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error(`Unsupported file type: ${mimeType}`);
}

// ─── System prompts ────────────────────────────────────────────────────────────

const GAP_SCHEMA = `
OUTPUT FORMAT (ONLY JSON, no markdown):
{
  "summary": "2-3 sentence expert overview of what the document describes",
  "architecture_type": "Data Warehouse|Data Lake|Lakehouse|Data Mesh|Hub and Spoke|Event Streaming|Microservices|Lambda|Kappa|Hybrid|Unknown",
  "maturity_score": <1.0-5.0>,
  "maturity_classification": "Ad hoc|Developing|Managed|Advanced|Optimised",
  "gaps": [
    {
      "category": "<category_key>",
      "label": "<human label>",
      "severity": "critical|high|medium|low",
      "finding": "<1-2 sentence specific finding>",
      "recommendation": "<specific actionable recommendation>",
      "tools": ["<open source tool>", "<AWS equivalent>"],
      "score": <1-5>
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "fair_scores": { "findable": <0-100>, "accessible": <0-100>, "interoperable": <0-100>, "reusable": <0-100> },
  "standards_alignment": { "dcat": <0-100>, "metadata_completeness": <0-100>, "governance_maturity": <0-100> },
  "clarifying_questions": [
    {
      "id": "q1",
      "category": "<category_key>",
      "question": "<single focused question about a gap>",
      "type": "yes_no|multiple_choice|open_text",
      "options": [],
      "priority": "high|medium|low"
    }
  ],
  "report_readiness": <0-100>
}

Rules:
- gaps array: include ALL 18 categories, even if no gap (score 4-5 = no gap, severity "low")
- clarifying_questions: 3-6 questions targeting the most critical gaps
- maturity_score: average of gap scores`;

const GAP_CATEGORIES = `
GAP CATEGORIES TO ASSESS:
1. ingestion: Data ingestion patterns, connectors, streaming vs batch
2. storage: Storage layers, formats (Parquet/Delta/Iceberg), tiering
3. transformation: ETL/ELT, dbt, data processing frameworks
4. governance: Data governance policies, ownership, stewardship
5. quality: Data quality checks, Great Expectations, validation
6. security: RBAC, encryption, PII/GDPR handling, audit trails
7. lineage: End-to-end data lineage tracking
8. catalogue: Data catalogue, metadata management, discovery
9. observability: Monitoring, alerting, SLA/SLO tracking
10. cicd: CI/CD pipelines for data, DataOps practices
11. analytics: BI, self-service analytics, consumption patterns
12. ml_ai: ML/AI readiness, feature stores, model serving
13. cost: Cost attribution, optimisation, lifecycle management
14. interoperability: APIs, open standards, data sharing
15. cloud_portability: Vendor lock-in risk, multi-cloud strategy
16. data_contracts: Schema contracts, SLAs between producers/consumers
17. environments: Dev/test/prod environment management
18. operating_model: Ownership model, data mesh vs centralised`;

const PERSONA = `You are a senior enterprise data architect with TOGAF 9.2, DAMA-DMBOK 2, and UK GDS certifications. You specialise in data architecture gap analysis, assessing designs against:
- TOGAF ADM phases (Architecture Vision, Business Architecture, Data Architecture, Technology Architecture)
- DAMA-DMBOK 2 knowledge areas
- FAIR data principles (Findable, Accessible, Interoperable, Reusable)
- DCAT-AP 3 metadata standards
- UK GDS / CDDO data architecture standards
- Cyber Essentials Plus and ISO 27001
- Open-source first vendor neutral recommendations (with AWS/Azure/GCP equivalents)`;

const VISION_SYSTEM = `${PERSONA}

You will receive an architecture diagram image. Analyse it thoroughly across 18 categories and output ONLY valid JSON — no markdown, no prose outside JSON.
${GAP_CATEGORIES}
${GAP_SCHEMA}
Be specific — reference actual elements visible in the diagram.`;

const DOCUMENT_SYSTEM = `${PERSONA}

You will receive the text content extracted from an architecture document (PDF or Word). Analyse it thoroughly across 18 categories and output ONLY valid JSON — no markdown, no prose outside JSON.
${GAP_CATEGORIES}
${GAP_SCHEMA}
Be specific — reference actual sections, components, and statements from the document. Where information is absent from the document, note that as a gap requiring clarification.`;

const REFINE_SYSTEM = `You are the same senior enterprise data architect. You have already analysed an architecture design and produced a gap analysis JSON. Now the user has answered a clarifying question. Update the analysis JSON incorporating their answer.

Rules:
- Output ONLY valid JSON in the same schema as the original analysis
- Update the relevant gap's score and severity based on the answer
- Update fair_scores, standards_alignment, maturity_score, maturity_classification accordingly
- Remove the answered question from clarifying_questions (or mark answered)
- Add any new clarifying questions if the answer reveals additional gaps
- Update report_readiness (increase it as questions are answered)
- Keep all 18 gap categories in gaps array`;

const REPORT_SYSTEM = `You are the same senior enterprise data architect. You have conducted a full gap analysis with clarifying questions answered. Now generate a comprehensive consulting-grade architecture gap report.

Structure the report as flowing Markdown with these sections:
# Executive Summary
## Architecture Overview
## Current State Assessment
### Architecture Pattern
### Maturity Score
## Critical Gaps
## High Priority Gaps
## Improvement Roadmap
### Phase 1: Foundations (0-3 months)
### Phase 2: Stabilise (3-9 months)
### Phase 3: Scale (9-18 months)
## Tool Recommendations
### Open Source
### Cloud Managed Services (AWS)
## FAIR Principles Assessment
## Standards Alignment
## Risk Register
## Next Steps

Be specific, reference actual findings from the analysis, recommend concrete tools and actions. Align to TOGAF ADM, DAMA-DMBOK 2, UK GDS, FAIR, DCAT-AP 3, Cyber Essentials.`;

// ─── POST /api/gap/analyse ─────────────────────────────────────────────────────

gapRouter.post('/analyse', async (req, res) => {
  const { imageBase64, mimeType = 'image/png', context = '' } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  const buffer = Buffer.from(imageBase64, 'base64');
  let messages;

  try {
    if (isImage(mimeType)) {
      // ── Vision path ──
      const userContent = [
        {
          image: {
            format: mimeType.split('/')[1] ?? 'png',
            source: { bytes: buffer },
          },
        },
      ];
      if (context.trim()) {
        userContent.push({ text: `Additional context: ${context}` });
      }
      userContent.push({ text: 'Please analyse this architecture diagram and produce the gap analysis JSON.' });

      messages = [{ role: 'user', content: userContent }];

      const response = await bedrock.send(new ConverseCommand({
        modelId: MODEL_ID,
        system: [{ text: VISION_SYSTEM }],
        messages,
        inferenceConfig: { maxTokens: 4000, temperature: 0.3 },
      }));

      const raw = response.output?.message?.content?.[0]?.text ?? '{}';
      const match = raw.match(/\{[\s\S]*\}/);
      return res.json(JSON.parse(match ? match[0] : raw));

    } else {
      // ── Document text extraction path ──
      let extractedText;
      try {
        extractedText = await extractText(buffer, mimeType);
      } catch (extractErr) {
        return res.status(400).json({ error: `Could not extract text: ${extractErr.message}` });
      }

      if (!extractedText || extractedText.trim().length < 50) {
        return res.status(400).json({ error: 'Document appears to be empty or could not be read. Please check the file and try again.' });
      }

      const textContent = [
        {
          text: `Architecture document content:\n\n${extractedText.slice(0, 80000)}${
            extractedText.length > 80000 ? '\n\n[Document truncated at 80,000 characters]' : ''
          }${context.trim() ? `\n\nAdditional context from the user: ${context}` : ''}

Please analyse this architecture document and produce the gap analysis JSON.`,
        },
      ];

      messages = [{ role: 'user', content: textContent }];

      const response = await bedrock.send(new ConverseCommand({
        modelId: MODEL_ID,
        system: [{ text: DOCUMENT_SYSTEM }],
        messages,
        inferenceConfig: { maxTokens: 4000, temperature: 0.3 },
      }));

      const raw = response.output?.message?.content?.[0]?.text ?? '{}';
      const match = raw.match(/\{[\s\S]*\}/);
      return res.json(JSON.parse(match ? match[0] : raw));
    }
  } catch (err) {
    console.error('[gap/analyse]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/gap/refine ──────────────────────────────────────────────────────

gapRouter.post('/refine', async (req, res) => {
  const { analysis, questionId, question, answer } = req.body;

  if (!analysis || !answer) {
    return res.status(400).json({ error: 'analysis and answer are required' });
  }

  try {
    const response = await bedrock.send(new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: REFINE_SYSTEM }],
      messages: [
        {
          role: 'user',
          content: [{
            text: `Original gap analysis:\n${JSON.stringify(analysis, null, 2)}\n\nQuestion answered (id: ${questionId}): ${question}\nAnswer: ${answer}\n\nPlease update the gap analysis JSON incorporating this answer.`,
          }],
        },
      ],
      inferenceConfig: { maxTokens: 4000, temperature: 0.3 },
    }));

    const raw = response.output?.message?.content?.[0]?.text ?? '{}';
    const match = raw.match(/\{[\s\S]*\}/);
    res.json(JSON.parse(match ? match[0] : raw));
  } catch (err) {
    console.error('[gap/refine]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/gap/report (SSE streaming) ─────────────────────────────────────

gapRouter.post('/report', async (req, res) => {
  const { analysis } = req.body;

  if (!analysis) {
    return res.status(400).json({ error: 'analysis is required' });
  }

  res.setHeader('Content-Type',      'text/event-stream');
  res.setHeader('Cache-Control',     'no-cache');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = d => res.write(`data: ${JSON.stringify(d)}\n\n`);

  try {
    const stream = await bedrock.send(new ConverseStreamCommand({
      modelId: MODEL_ID,
      system: [{ text: REPORT_SYSTEM }],
      messages: [
        {
          role: 'user',
          content: [{
            text: `Gap analysis results:\n${JSON.stringify(analysis, null, 2)}\n\nGenerate the comprehensive architecture gap report now.`,
          }],
        },
      ],
      inferenceConfig: { maxTokens: 5000, temperature: 0.4 },
    }));

    for await (const event of stream.stream) {
      if (event.contentBlockDelta?.delta?.text) {
        send({ type: 'delta', text: event.contentBlockDelta.delta.text });
      }
      if (event.messageStop) send({ type: 'done' });
    }
  } catch (err) {
    console.error('[gap/report]', err);
    send({ type: 'error', error: err.message });
  } finally {
    res.end();
  }
});

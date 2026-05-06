import { Router } from 'express';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';

export const aiRouter = Router();

const REGION   = process.env.AWS_REGION       ?? 'eu-west-2';
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-opus-4-7';

const bedrock = new BedrockRuntimeClient({ region: REGION });

// ─── Shared helpers ────────────────────────────────────────────────────────────

function scoresSummary(dimensionScores) {
  return dimensionScores
    .map(d => `${d.label}: ${d.score}/5`)
    .join(', ');
}

function systemPrompt(result) {
  return `You are an expert data architecture consultant reviewing an organisation's maturity assessment results.

Assessment summary:
- Overall score: ${result.overallScore}/5 (${result.classification})
- Architecture mode: ${result.mode}
- Dimension scores: ${scoresSummary(result.dimensionScores)}
- Top risks: ${result.risks.slice(0, 3).map(r => `${r.area} (${r.severity})`).join(', ')}

Provide authoritative, specific, actionable advice grounded in the actual scores above.
Use concrete tool names (DataHub, dbt, Great Expectations, Airflow, etc.) appropriate to their architecture mode.
Be direct and professional. Never be vague or generic.`;
}

// ─── POST /api/narrative ───────────────────────────────────────────────────────
// Generate a personalised AI executive narrative from scores.

aiRouter.post('/narrative', async (req, res) => {
  const { result, answers } = req.body;
  if (!result) return res.status(400).json({ error: 'result is required' });

  const prompt = `Write a concise, expert executive narrative (4–5 paragraphs) for this data architecture assessment.

The narrative should:
1. Open with a direct characterisation of the current maturity state based on the score of ${result.overallScore}/5 (${result.classification})
2. Highlight the 2–3 strongest dimensions and what that signals about the organisation
3. Identify the most critical gaps — specifically the lowest-scoring dimensions — and the business risk they create
4. Recommend the single most important next action with a concrete first step
5. Close with a forward-looking statement about what reaching the next maturity level will unlock

Dimension scores: ${scoresSummary(result.dimensionScores)}
Architecture mode: ${result.mode}

Write in second person ("Your organisation..."). Be specific, not generic. Do not use bullet points — flowing paragraphs only.`;

  try {
    const response = await bedrock.send(new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: systemPrompt(result) }],
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 1024, temperature: 0.7 },
    }));

    const text = response.output?.message?.content?.[0]?.text ?? '';
    res.json({ narrative: text });
  } catch (err) {
    console.error('[narrative]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/roadmap ────────────────────────────────────────────────────────
// Generate a personalised 3-phase roadmap from scores.

aiRouter.post('/roadmap', async (req, res) => {
  const { result } = req.body;
  if (!result) return res.status(400).json({ error: 'result is required' });

  const weakDimensions = result.dimensionScores
    .filter(d => d.score < 3.5)
    .sort((a, b) => a.score - b.score)
    .slice(0, 6)
    .map(d => `${d.label} (${d.score}/5)`)
    .join(', ');

  const prompt = `Generate a personalised 3-phase data architecture improvement roadmap as JSON.

Weak dimensions to address: ${weakDimensions}
Architecture mode: ${result.mode}
Overall score: ${result.overallScore}/5

Return ONLY valid JSON matching this exact structure:
{
  "phases": [
    {
      "phase": "Phase 1",
      "title": "Quick wins (0–3 months)",
      "theme": "one-line theme",
      "actions": ["action 1", "action 2", "action 3", "action 4"],
      "tools": ["Tool A", "Tool B"],
      "outcome": "measurable outcome sentence"
    },
    {
      "phase": "Phase 2",
      "title": "Stabilisation (3–9 months)",
      "theme": "one-line theme",
      "actions": ["action 1", "action 2", "action 3", "action 4"],
      "tools": ["Tool A", "Tool B"],
      "outcome": "measurable outcome sentence"
    },
    {
      "phase": "Phase 3",
      "title": "Scale and optimise (9–18 months)",
      "theme": "one-line theme",
      "actions": ["action 1", "action 2", "action 3", "action 4"],
      "tools": ["Tool A", "Tool B"],
      "outcome": "measurable outcome sentence"
    }
  ]
}

Make each action specific and concrete, not generic. Use tool names relevant to ${result.mode} architecture.`;

  try {
    const response = await bedrock.send(new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: systemPrompt(result) }],
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 1500, temperature: 0.5 },
    }));

    const raw = response.output?.message?.content?.[0]?.text ?? '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    res.json(parsed);
  } catch (err) {
    console.error('[roadmap]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/chat ───────────────────────────────────────────────────────────
// Streaming chat — Server-Sent Events.

aiRouter.post('/chat', async (req, res) => {
  const { message, history = [], result } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });
  if (!result)  return res.status(400).json({ error: 'result is required' });

  // Build conversation history for Bedrock Converse format
  const messages = [
    ...history.map(m => ({
      role: m.role,
      content: [{ text: m.content }],
    })),
    { role: 'user', content: [{ text: message }] },
  ];

  // SSE headers
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const stream = await bedrock.send(new ConverseStreamCommand({
      modelId: MODEL_ID,
      system: [{ text: systemPrompt(result) }],
      messages,
      inferenceConfig: { maxTokens: 1024, temperature: 0.7 },
    }));

    for await (const event of stream.stream) {
      if (event.contentBlockDelta?.delta?.text) {
        send({ type: 'delta', text: event.contentBlockDelta.delta.text });
      }
      if (event.messageStop) {
        send({ type: 'done' });
      }
    }
  } catch (err) {
    console.error('[chat]', err);
    send({ type: 'error', error: err.message });
  } finally {
    res.end();
  }
});

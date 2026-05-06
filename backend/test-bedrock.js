#!/usr/bin/env node
/**
 * Bedrock smoke-test: lists available Claude models then sends a test request.
 * Run on the EC2 instance via Docker:  ./test-bedrock-server.sh
 */

import { BedrockClient, ListFoundationModelsCommand, ListInferenceProfilesCommand } from '@aws-sdk/client-bedrock';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const REGION   = process.env.AWS_REGION       ?? 'eu-west-2';
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-opus-4-6-v1';

console.log('─'.repeat(60));
console.log('Bedrock connectivity test');
console.log(`  Region : ${REGION}`);
console.log(`  Model  : ${MODEL_ID}`);
console.log('─'.repeat(60));

async function listModels() {
  const client = new BedrockClient({ region: REGION });

  // List base foundation models (Anthropic only)
  console.log('\n[1] Available Anthropic foundation models in', REGION + ':');
  try {
    const res = await client.send(new ListFoundationModelsCommand({ byProvider: 'Anthropic' }));
    (res.modelSummaries ?? []).forEach(m =>
      console.log(`    ${m.modelId}  (${m.modelName})`));
  } catch (e) {
    console.log('    Could not list foundation models:', e.message);
  }

  // List cross-region inference profiles (these have the eu.* prefix)
  console.log('\n[2] Cross-region inference profiles matching "claude" in', REGION + ':');
  try {
    const res = await client.send(new ListInferenceProfilesCommand({}));
    const claude = (res.inferenceProfileSummaries ?? []).filter(p =>
      p.inferenceProfileId?.toLowerCase().includes('claude'));
    if (claude.length === 0) {
      console.log('    (none found — model access may not be enabled)');
    } else {
      claude.forEach(p => console.log(`    ${p.inferenceProfileId}  (${p.inferenceProfileName})`));
    }
  } catch (e) {
    console.log('    Could not list inference profiles:', e.message);
  }
}

async function testInvoke() {
  console.log(`\n[3] Sending test request to: ${MODEL_ID}`);
  const client = new BedrockRuntimeClient({ region: REGION });
  const cmd = new ConverseCommand({
    modelId: MODEL_ID,
    messages: [{ role: 'user', content: [{ text: 'Reply with exactly: OK' }] }],
    inferenceConfig: { maxTokens: 10, temperature: 0 },
  });

  const start = Date.now();
  const response = await client.send(cmd);
  const elapsed = Date.now() - start;
  const text = response.output?.message?.content?.[0]?.text ?? '(empty)';
  const usage = response.usage ?? {};
  console.log(`    Response (${elapsed}ms): "${text}"`);
  console.log(`    Tokens — input: ${usage.inputTokens}, output: ${usage.outputTokens}`);
  console.log('\n✓  Bedrock is accessible and the model is enabled.\n');
}

await listModels();

try {
  await testInvoke();
} catch (err) {
  console.error(`\n✗  Invoke failed: ${err.message}`);
  if (err.name === 'AccessDeniedException') {
    console.error('   → IAM role is missing bedrock:InvokeModel permission.');
  } else if (err.name === 'ResourceNotFoundException' || err.message?.includes('invalid')) {
    console.error(`   → Model ID "${MODEL_ID}" is not valid or not enabled.`);
    console.error('   → Copy a model ID from the list above and set BEDROCK_MODEL_ID.');
  } else if (err.name === 'CredentialsProviderError') {
    console.error('   → No AWS credentials found. Is the IAM role attached to this instance?');
  }
  process.exit(1);
}

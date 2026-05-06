#!/usr/bin/env node
/**
 * Quick smoke-test for AWS Bedrock connectivity.
 * Run on the EC2 instance:  node test-bedrock.js
 * Requires: npm install (or npx with inline deps)
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const REGION   = process.env.AWS_REGION       ?? 'eu-west-2';
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'eu.anthropic.claude-opus-4-7-v1:0';

console.log('─'.repeat(55));
console.log('Bedrock connectivity test');
console.log(`  Region : ${REGION}`);
console.log(`  Model  : ${MODEL_ID}`);
console.log('─'.repeat(55));

async function run() {
  const client = new BedrockRuntimeClient({ region: REGION });

  const cmd = new ConverseCommand({
    modelId: MODEL_ID,
    messages: [{ role: 'user', content: [{ text: 'Reply with exactly: OK' }] }],
    inferenceConfig: { maxTokens: 10, temperature: 0 },
  });

  console.log('Sending test request…');
  const start = Date.now();

  const response = await client.send(cmd);
  const elapsed = Date.now() - start;

  const text = response.output?.message?.content?.[0]?.text ?? '(empty)';
  const usage = response.usage ?? {};

  console.log(`\nResponse (${elapsed}ms): "${text}"`);
  console.log(`Tokens used — input: ${usage.inputTokens}, output: ${usage.outputTokens}`);
  console.log('\n✓ Bedrock is accessible and the model is enabled.');
}

run().catch(err => {
  console.error('\n✗ Test failed:', err.message);
  if (err.name === 'AccessDeniedException') {
    console.error('  → IAM role is missing bedrock:InvokeModel permission.');
  } else if (err.name === 'ResourceNotFoundException') {
    console.error(`  → Model "${MODEL_ID}" is not enabled in ${REGION}.`);
    console.error('  → Enable it in the Bedrock console: Model access → Anthropic.');
  } else if (err.name === 'CredentialsProviderError') {
    console.error('  → Could not find AWS credentials. Is the IAM role attached to this instance?');
  }
  process.exit(1);
});

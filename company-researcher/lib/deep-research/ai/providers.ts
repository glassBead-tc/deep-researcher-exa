import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV1, generateText } from 'ai';
import { getEncoding } from 'js-tiktoken';
import { traceable } from "langsmith/traceable";

import { RecursiveCharacterTextSplitter } from './text-splitter';

// Providers
console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_ENDPOINT:', process.env.OPENAI_ENDPOINT || 'https://api.openai.com');

const openai = process.env.OPENAI_API_KEY
  ? createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_ENDPOINT || 'https://api.openai.com',
    })
  : undefined;

console.log('openai instance created:', !!openai);

const customModel = process.env.CUSTOM_MODEL
  ? openai?.(process.env.CUSTOM_MODEL, {
       structuredOutputs: true,
     })
  : undefined;

// Models
console.log('Creating o3Model with openai instance:', !!openai);
const o3Model = openai?.('o3', {
  reasoningEffort: 'high',
  structuredOutputs: true,
});
console.log('o3Model created:', !!o3Model);

const o4Model = openai?.('o4-mini', {
  reasoningEffort: 'medium',
  structuredOutputs: true,
});
console.log('o4Model created:', !!o4Model);

export function getModel(): LanguageModelV1 {
  console.log('Getting model, available models:');
  console.log('- customModel:', !!customModel);
  console.log('- o3Model:', !!o3Model);
  console.log('- o4Model:', !!o4Model);

  if (customModel) {
    console.log('Using customModel');
    return customModel;
  }

  let model: LanguageModelV1 | undefined;

  // Prioritize gpt4point1 since o3Model is currently unavailable
  model = o4Model;

  if (!model) {
    throw new Error('No model found');
  }

  console.log('Using model:', model.provider || 'unknown', model.modelId || 'unknown');
  return model as LanguageModelV1;
}

const MinChunkSize = 140;
const encoder = getEncoding('o200k_base');

// trim prompt to maximum context size
export function trimPrompt(
  prompt: string,
  contextSize = Number(process.env.CONTEXT_SIZE) || 128_000,
) {
  if (!prompt) {
    return '';
  }

  const length = encoder.encode(prompt).length;
  if (length <= contextSize) {
    return prompt;
  }

  const overflowTokens = length - contextSize;
  // on average it's 3 characters per token, so multiply by 3 to get a rough estimate of the number of characters
  const chunkSize = prompt.length - overflowTokens * 3;
  if (chunkSize < MinChunkSize) {
    return prompt.slice(0, MinChunkSize);
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: 0,
  });
  const trimmedPrompt = splitter.splitText(prompt)[0] ?? '';

  // last catch, there's a chance that the trimmed prompt is same length as the original prompt, due to how tokens are split & innerworkings of the splitter, handle this case by just doing a hard cut
  if (trimmedPrompt.length === prompt.length) {
    return trimPrompt(prompt.slice(0, chunkSize), contextSize);
  }

  // recursively trim until the prompt is within the context size
  return trimPrompt(trimmedPrompt, contextSize);
}

/**
 * Calls the AI model with the given prompt and returns the response
 */
export const callAIModel = traceable(
  async (prompt: string): Promise<string> => {
    const model = getModel();
    const { text } = await generateText({
      model,
      prompt,
    });
    return text;
  },
  { name: "callAIModel", run_type: "llm" }
);

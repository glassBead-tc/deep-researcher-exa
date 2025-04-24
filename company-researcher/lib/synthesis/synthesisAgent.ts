import { callAIModel } from '../deep-research/ai/providers';
import { writeFinalReport, writeFinalAnswer } from '../deep-research/deep-research';
import { synthesisSystemPrompt } from '../deep-research/prompt';

export type OutputMode = 'report' | 'answer';

interface SynthesisInput {
  mode: OutputMode;
  prompt: string;
  originalQuery: string;
  learnings: string[];
  visitedUrls?: string[];
}

export async function runSynthesisAgent({
  mode,
  prompt,
  originalQuery,
  learnings,
  visitedUrls = [],
}: SynthesisInput): Promise<string> {
  try {
    if (mode === 'report') {
      // Pass the synthesisSystemPrompt to writeFinalReport
      return await writeFinalReport({ prompt, originalQuery, learnings, visitedUrls });
    }

    if (mode === 'answer') {
      // Pass the synthesisSystemPrompt to writeFinalAnswer
      return await writeFinalAnswer({ prompt, originalQuery, learnings });
    }

    throw new Error(`Unknown synthesis mode: ${mode}`);
  } catch (err: any) {
    console.error('Synthesis agent failed:', err.message);
    return `⚠️ Error generating ${mode}: ${err.message}`;
  }
}

/**
 * Transforms an array of research learnings into cohesive, narrative text based on the given prompt.
 * This function takes bullet-point style research findings and synthesizes them into well-structured,
 * formal prose with logical paragraph organization and smooth transitions.
 *
 * @param learnings - Array of string learnings/insights to be synthesized
 * @param prompt - The user prompt providing context for the synthesis
 * @param options - Optional configuration parameters
 * @returns A Promise that resolves to a string containing the synthesized narrative
 * @throws Will throw an error if the AI model call fails
 */
/**
 * Configuration options for the synthesizeLearnings function
 */
export interface SynthesisOptions {
  /** Optional maximum length for the synthesized output (in words) */
  maxLength?: number;
  /** Optional tone setting, defaults to 'formal' */
  tone?: 'formal' | 'informative' | 'analytical';
  /** Optional batch size for processing large arrays of learnings */
  batchSize?: number;
}

/**
 * Default options for synthesis
 */
const DEFAULT_SYNTHESIS_OPTIONS: SynthesisOptions = {
  tone: 'formal',
  batchSize: 50 // Default batch size for large arrays
};

/**
 * Maximum number of tokens to allow in a prompt before chunking
 */
const MAX_PROMPT_TOKENS = 8000;

/**
 * Transforms an array of research learnings into cohesive, narrative text based on the given prompt.
 * This function takes bullet-point style research findings and synthesizes them into well-structured,
 * formal prose with logical paragraph organization and smooth transitions.
 *
 * For large arrays of learnings, the function automatically processes them in batches to avoid
 * exceeding token limits, then combines the results.
 *
 * @param learnings - Array of string learnings/insights to be synthesized
 * @param prompt - The user prompt providing context for the synthesis
 * @param options - Optional configuration parameters
 * @returns A Promise that resolves to a string containing the synthesized narrative
 * @throws Will throw an error if the AI model call fails
 */
export async function synthesizeLearnings(
  learnings: string[],
  prompt: string,
  options?: SynthesisOptions
): Promise<string> {
  try {
    // Handle empty learnings array gracefully
    if (!learnings || learnings.length === 0) {
      return "No research findings to synthesize.";
    }

    // Merge provided options with defaults
    const mergedOptions = { ...DEFAULT_SYNTHESIS_OPTIONS, ...options };
    
    // For very large arrays, process in batches
    if (learnings.length > mergedOptions.batchSize!) {
      return processBatchedLearnings(learnings, prompt, mergedOptions);
    }

    // Format learnings with XML tags
    const formattedLearnings = learnings.map(learning => `<learning>${learning}</learning>`).join('\n');
    
    // Build the prompt using a structured approach
    const completePrompt = buildSynthesisPrompt(prompt, formattedLearnings, mergedOptions);
    
    // Call the AI model with the constructed prompt
    const synthesizedText = await callAIModel(completePrompt);
    
    return synthesizedText;
  } catch (error: any) {
    console.error('Error in synthesizeLearnings:', error.message);
    throw new Error(`Failed to synthesize learnings: ${error.message}`);
  }
}

/**
 * Builds a structured synthesis prompt with all necessary components
 *
 * @param prompt - The user prompt providing context
 * @param formattedLearnings - The learnings formatted with XML tags
 * @param options - Synthesis options
 * @returns A complete prompt string
 */
function buildSynthesisPrompt(
  prompt: string,
  formattedLearnings: string,
  options: SynthesisOptions
): string {
  let completePrompt = `${synthesisSystemPrompt()}\n\n`;
  
  // Add tone instruction if specified
  if (options.tone) {
    completePrompt += `Maintain a ${options.tone} tone throughout the synthesis.\n\n`;
  }
  
  // Add max length instruction if specified
  if (options.maxLength) {
    completePrompt += `Keep the synthesis under approximately ${options.maxLength} words.\n\n`;
  }
  
  // Add user context and formatted learnings
  completePrompt += `CONTEXT: ${prompt}\n\n`;
  completePrompt += `LEARNINGS TO SYNTHESIZE:\n${formattedLearnings}\n\n`;
  completePrompt += `Please synthesize these learnings into a cohesive narrative that addresses the context.`;
  
  // Ensure the prompt doesn't exceed token limits
  // This uses the trimPrompt function from providers.ts if needed
  if (completePrompt.length > 100000) { // Rough estimate for token limit concern
    try {
      // Import dynamically to avoid circular dependencies
      const { trimPrompt } = require('../deep-research/ai/providers');
      return trimPrompt(completePrompt, MAX_PROMPT_TOKENS);
    } catch (error) {
      // If trimPrompt is not available, use a simple truncation
      console.warn('trimPrompt function not available, using simple truncation');
      return completePrompt.slice(0, 100000);
    }
  }
  
  return completePrompt;
}

/**
 * Processes large arrays of learnings in batches and combines the results
 *
 * @param learnings - The full array of learnings
 * @param prompt - The user prompt
 * @param options - Synthesis options
 * @returns A combined synthesis of all batches
 */
async function processBatchedLearnings(
  learnings: string[],
  prompt: string,
  options: SynthesisOptions
): Promise<string> {
  const batchSize = options.batchSize || DEFAULT_SYNTHESIS_OPTIONS.batchSize!;
  const batches: string[][] = [];
  
  // Split learnings into batches
  for (let i = 0; i < learnings.length; i += batchSize) {
    batches.push(learnings.slice(i, i + batchSize));
  }
  
  // Process each batch
  const batchResults: string[] = [];
  for (let i = 0; i < batches.length; i++) {
    const batchPrompt = `${prompt} (Part ${i + 1} of ${batches.length})`;
    const batchLearnings = batches[i];
    
    // Process this batch
    const batchResult = await synthesizeLearnings(
      batchLearnings,
      batchPrompt,
      { ...options, batchSize: Infinity } // Prevent recursive batching
    );
    
    batchResults.push(batchResult);
  }
  
  // If we only have one batch result, return it directly
  if (batchResults.length === 1) {
    return batchResults[0];
  }
  
  // Otherwise, synthesize the batch results into a final result
  const combinedLearnings = batchResults.map((result, index) =>
    `Part ${index + 1} of ${batchResults.length}: ${result}`
  );
  
  return synthesizeLearnings(
    combinedLearnings,
    `${prompt} (Final synthesis of ${batches.length} parts)`,
    { ...options, batchSize: Infinity } // Prevent recursive batching
  );
}
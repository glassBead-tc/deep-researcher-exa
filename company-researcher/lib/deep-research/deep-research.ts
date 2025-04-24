import Exa, { SearchResponse } from "exa-js";
import { generateObject } from "ai";
import { compact } from "lodash-es";
import pLimit from "p-limit";
import { z } from "zod";

import { getModel, trimPrompt } from "./ai/providers";
import { systemPrompt, academicReportSystemPrompt } from "./prompt";
import { traceable } from "langsmith/traceable";

function log(...args: any[]) {
  console.log(...args);
}

export type ResearchProgress = {
  currentDepth: number;
  totalDepth: number;
  currentBreadth: number;
  totalBreadth: number;
  currentQuery?: string;
  totalQueries: number;
  completedQueries: number;
};

type ResearchResult = {
  learnings: string[];
  visitedUrls: string[];
};

// increase this if you have higher API rate limits
const ConcurrencyLimit = Number(process.env.EXA_CONCURRENCY) || 2;

// instantiate once
const exa = new Exa(process.env.EXA_API_KEY as string);

// take en user query, return a list of SERP queries
const generateSerpQueries = traceable(
  async ({
    query,
    originalQuery,
    numQueries = 3,
    learnings,
  }: {
    query: string;
    originalQuery: string;
    numQueries?: number;

    // optional, if provided, the research will continue from the last learning
    learnings?: string[];
  }) => {
    const res = await generateObject({
      model: getModel(),
      system: systemPrompt(),
      prompt: `Given the following prompt from the user, generate a list of SERP queries to research the topic. Return a maximum of ${numQueries} queries, but feel free to return less if the original prompt is clear. Make sure each query is unique and not similar to each other: <prompt>${query}</prompt>\n\n${
        learnings
          ? `Here are some learnings from previous research, use them to generate more specific queries: ${learnings.join(
              '\n',
            )}`
          : ''
      }\n\nOriginal research request from user: <original_query>${originalQuery}</original_query>\nKeep your queries focused on answering this original request.`,
      schema: z.object({
        queries: z
          .array(
            z.object({
              query: z.string().describe('The SERP query'),
              researchGoal: z
                .string()
                .describe(
                  'First talk about the goal of the research that this query is meant to accomplish, then go deeper into how to advance the research once the results are found, mention additional research directions. Be as specific as possible, especially for additional research directions.',
                ),
            }),
          )
          .describe(`List of SERP queries, max of ${numQueries}`),
      }),
    });
    log(`Created ${res.object.queries.length} queries`, res.object.queries);

    return res.object.queries.slice(0, numQueries);
  },
  { name: "generateSerpQueries" }
);

// Change to using traceable wrapper pattern for processSerpResult
const processSerpResult = traceable(
  async ({
    query,
    originalQuery,
    result,
    numLearnings = 3,
    numFollowUpQuestions = 3,
  }: {
    query: string;
    originalQuery: string;
    result: SearchResponse<any>;
    numLearnings?: number;
    numFollowUpQuestions?: number;
  }) => {
    const contents = compact(result.results.map(r => r.text))
      .map(t => trimPrompt(t ?? '', 25_000));
    log(`Ran ${query}, found ${contents.length} contents`);

    const res = await generateObject({
      model: getModel(),
      abortSignal: AbortSignal.timeout(60_000),
      system: systemPrompt(),
      prompt: trimPrompt(
        `Given the following contents from a SERP search for the query <query>${query}</query>, generate a list of learnings from the contents. Return a maximum of ${numLearnings} learnings, but feel free to return less if the contents are clear. Make sure each learning is unique and not similar to each other. The learnings should be concise and to the point, as detailed and information dense as possible. Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any exact metrics, numbers, or dates. The learnings will be used to research the topic further.\n\n<contents>${contents
          .map(content => `<content>\n${content}\n</content>`)
          .join('\n')}</contents>\n\nOriginal research request from user: <original_query>${originalQuery}</original_query>\nMake sure your learnings are focused on answering this original request.`,
      ),
      schema: z.object({
        learnings: z.array(z.string()).describe(`List of learnings, max of ${numLearnings}`),
        followUpQuestions: z
          .array(z.string())
          .describe(
            `List of follow-up questions to research the topic further, max of ${numFollowUpQuestions}`,
          ),
      }),
    });
    log(`Created ${res.object.learnings.length} learnings`, res.object.learnings);

    return res.object;
  },
  { name: "processSerpResult" }
);

/**
 * Options for report generation
 */
export interface ReportGenerationOptions {
  /** Whether to include counterarguments in the report */
  includeCounterarguments?: boolean;
  /** The tone to use for the report */
  tone?: 'academic' | 'formal' | 'informative';
  /** The maximum length of the report in words */
  maxLength?: number;
}

/**
 * Request for generating a report
 */
export interface ReportGenerationRequest {
  /** The prompt from the user */
  prompt: string;
  /** The original query from the user */
  originalQuery: string;
  /** The learnings from the research */
  learnings: string[];
  /** The URLs visited during research */
  visitedUrls: string[];
  /** Options for report generation */
  options?: ReportGenerationOptions;
}

/**
 * Result of report generation
 */
export interface ReportGenerationResult {
  /** The generated report in Markdown format */
  reportMarkdown: string;
  /** The answer derived from the learnings */
  answer: string;
  /** The key findings that support the answer */
  keyFindings: string[];
  /** The sources referenced in the report */
  sources: string[];
}

/**
 * Analyzes the relevancy of learnings to the original query
 *
 * @param learnings - Array of learnings from research
 * @param originalQuery - The original query from the user
 * @returns An array of learnings sorted by relevance
 */
async function analyzeRelevancy(
  learnings: string[],
  originalQuery: string
): Promise<string[]> {
  // If there are no learnings, return an empty array
  if (!learnings || learnings.length === 0) {
    return [];
  }

  try {
    const res = await generateObject({
      model: getModel(),
      system: academicReportSystemPrompt(),
      prompt: trimPrompt(
        `Analyze the following learnings and rank them by relevance to the original query: "${originalQuery}". Return the learnings sorted from most relevant to least relevant.
        
        <learnings>
        ${learnings.map((learning, index) => `${index + 1}. ${learning}`).join('\n')}
        </learnings>`,
      ),
      schema: z.object({
        rankedLearnings: z.array(z.string()).describe('Learnings sorted by relevance to the query'),
      }),
    });

    return res.object.rankedLearnings;
  } catch (error) {
    console.error('Error analyzing relevancy:', error);
    // If there's an error, return the original learnings
    return learnings;
  }
}

/**
 * Derives an answer from the learnings
 *
 * @param learnings - Array of learnings from research
 * @param originalQuery - The original query from the user
 * @returns The derived answer
 */
async function deriveAnswerFromLearnings(
  learnings: string[],
  originalQuery: string
): Promise<string> {
  // If there are no learnings, return a default message
  if (!learnings || learnings.length === 0) {
    return "Based on the research, no conclusive answer could be determined.";
  }

  try {
    const res = await generateObject({
      model: getModel(),
      system: academicReportSystemPrompt(),
      prompt: trimPrompt(
        `Based on the following learnings, derive a clear, concise answer to the original query: "${originalQuery}". The answer should be definitive and opinionated, taking a clear stance based on the evidence.
        
        <learnings>
        ${learnings.map((learning, index) => `${index + 1}. ${learning}`).join('\n')}
        </learnings>`,
      ),
      schema: z.object({
        answer: z.string().describe('A clear, concise answer to the original query'),
      }),
    });

    return res.object.answer;
  } catch (error) {
    console.error('Error deriving answer:', error);
    return "Based on the research, no conclusive answer could be determined due to an error in processing.";
  }
}

/**
 * Generates an academic report structure
 *
 * @param query - The original query
 * @param answer - The derived answer
 * @param relevantLearnings - The relevant learnings
 * @param visitedUrls - The URLs visited during research
 * @param includeCounterarguments - Whether to include counterarguments
 * @returns The report structure
 */
async function generateAcademicReportStructure(
  query: string,
  answer: string,
  relevantLearnings: string[],
  visitedUrls: string[],
  includeCounterarguments: boolean = true
): Promise<any> {
  try {
    const res = await generateObject({
      model: getModel(),
      system: academicReportSystemPrompt(),
      prompt: trimPrompt(
        `Generate a structured outline for an academic report that answers the query: "${query}".
        
        The report should:
        1. Start with the query and this answer: "${answer}"
        2. Present key findings as evidence supporting the answer
        3. Academically argue for the chosen answer based on the evidence
        4. Reference sources (visited URLs)
        ${includeCounterarguments ? '5. Address potential counterarguments when relevant' : ''}
        6. Conclude with a summary reinforcing the main argument
        
        <relevant_learnings>
        ${relevantLearnings.map((learning, index) => `${index + 1}. ${learning}`).join('\n')}
        </relevant_learnings>
        
        <visited_urls>
        ${visitedUrls.join('\n')}
        </visited_urls>`,
      ),
      schema: z.object({
        sections: z.array(z.object({
          title: z.string().describe('Section title'),
          content: z.string().describe('Brief description of what this section should contain'),
          keyLearningsToInclude: z.array(z.number()).describe('Indices of relevant learnings to include in this section (1-based)'),
        })).describe('Sections of the report'),
        keyFindings: z.array(z.string()).describe('Key findings that support the answer'),
      }),
    });

    return res.object;
  } catch (error) {
    console.error('Error generating report structure:', error);
    // Return a basic structure if there's an error
    return {
      sections: [
        {
          title: "Introduction",
          content: "Introduction to the query and answer",
          keyLearningsToInclude: [],
        },
        {
          title: "Key Findings",
          content: "Presentation of key findings",
          keyLearningsToInclude: Array.from({ length: relevantLearnings.length }, (_, i) => i + 1),
        },
        {
          title: "Conclusion",
          content: "Summary of findings and reinforcement of the answer",
          keyLearningsToInclude: [],
        },
      ],
      keyFindings: relevantLearnings.slice(0, 3),
    };
  }
}

/**
 * Generates a formatted report based on the report structure
 *
 * @param query - The original query
 * @param answer - The derived answer
 * @param reportStructure - The report structure
 * @param relevantLearnings - The relevant learnings
 * @param visitedUrls - The URLs visited during research
 * @param options - Options for report generation
 * @returns The formatted report
 */
async function generateFormattedReport(
  query: string,
  answer: string,
  reportStructure: any,
  relevantLearnings: string[],
  visitedUrls: string[],
  options: ReportGenerationOptions = {}
): Promise<string> {
  try {
    const tone = options.tone || 'academic';
    const maxLength = options.maxLength || 3000;

    const res = await generateObject({
      model: getModel(),
      system: academicReportSystemPrompt(),
      prompt: trimPrompt(
        `Generate a complete academic report based on the following structure. The report should:
        
        1. Start with the query: "${query}" and the answer: "${answer}"
        2. Present key findings as evidence supporting the answer
        3. Academically argue for the chosen answer based on the evidence
        4. Reference sources appropriately
        5. Address potential counterarguments when relevant
        6. Conclude with a summary reinforcing the main argument
        
        Use a ${tone} tone throughout the report. The report should be approximately ${maxLength} words.
        
        <report_structure>
        ${JSON.stringify(reportStructure, null, 2)}
        </report_structure>
        
        <relevant_learnings>
        ${relevantLearnings.map((learning, index) => `${index + 1}. ${learning}`).join('\n')}
        </relevant_learnings>
        
        <visited_urls>
        ${visitedUrls.join('\n')}
        </visited_urls>`,
      ),
      schema: z.object({
        reportMarkdown: z.string().describe('The complete report in Markdown format'),
      }),
    });

    return res.object.reportMarkdown;
  } catch (error) {
    console.error('Error generating formatted report:', error);
    
    // Generate a basic report if there's an error
    let basicReport = `# Research Report: ${query}\n\n`;
    basicReport += `## Answer\n\n${answer}\n\n`;
    basicReport += `## Key Findings\n\n`;
    
    for (let i = 0; i < Math.min(relevantLearnings.length, 5); i++) {
      basicReport += `- ${relevantLearnings[i]}\n`;
    }
    
    basicReport += `\n## Sources\n\n`;
    for (const url of visitedUrls) {
      basicReport += `- ${url}\n`;
    }
    
    return basicReport;
  }
}

/**
 * Writes a final report based on research findings
 *
 * @param request - The report generation request
 * @returns The generated report result
 */
export const writeFinalReport = traceable(
  async (
    request: ReportGenerationRequest
  ): Promise<ReportGenerationResult> => {
    const { prompt, originalQuery, learnings, visitedUrls, options = {} } = request;
    
    // Step 1: Analyze relevancy of learnings
    const relevantLearnings = await analyzeRelevancy(learnings, originalQuery);
    
    // Step 2: Derive an answer from the learnings
    const answer = await deriveAnswerFromLearnings(relevantLearnings.slice(0, 10), originalQuery);
    
    // Step 3: Generate the report structure
    const reportStructure = await generateAcademicReportStructure(
      originalQuery,
      answer,
      relevantLearnings,
      visitedUrls,
      options.includeCounterarguments
    );
    
    // Step 4: Generate the formatted report
    const report = await generateFormattedReport(
      originalQuery,
      answer,
      reportStructure,
      relevantLearnings,
      visitedUrls,
      options
    );
    
    // Step 5: Append the visited URLs section if not already included
    let finalReport = report;
    if (!report.includes('## Sources') && !report.includes('## References')) {
      const urlsSection = `\n\n## Sources\n\n${visitedUrls.map(url => `- ${url}`).join('\n')}`;
      finalReport = report + urlsSection;
    }
    
    // Step 6: Return the complete report generation result
    return {
      reportMarkdown: finalReport,
      answer: answer,
      keyFindings: reportStructure.keyFindings || relevantLearnings.slice(0, 5),
      sources: visitedUrls
    };
  },
  { name: "writeFinalReport" }
);

export const writeFinalAnswer = traceable(
  async ({
    prompt,
    originalQuery,
    learnings,
  }: {
    prompt: string;
    originalQuery: string;
    learnings: string[];
  }) => {
    const learningsString = learnings
      .map(learning => `<learning>\n${learning}\n</learning>`)
      .join('\n');

    const res = await generateObject({
      model: getModel(),
      system: systemPrompt(),
      prompt: trimPrompt(
        `Given the following prompt from the user, write a final answer on the topic using the learnings from research. Follow the format specified in the prompt. Do not yap or babble or include any other text than the answer besides the format specified in the prompt. Keep the answer as concise as possible - usually it should be just a few words or maximum a sentence. Try to follow the format specified in the prompt (for example, if the prompt is using Latex, the answer should be in Latex. If the prompt gives multiple answer choices, the answer should be one of the choices).\n\n<prompt>${prompt}</prompt>\n\nOriginal research request from user: <original_query>${originalQuery}</original_query>\n\nHere are all the learnings from research on the topic that you can use to help answer the prompt:\n\n<learnings>\n${learningsString}\n</learnings>`,
      ),
      schema: z.object({
        exactAnswer: z
          .string()
          .describe('The final answer, make it short and concise, just the answer, no other text'),
      }),
    });

    return res.object.exactAnswer;
  },
  { name: "writeFinalAnswer" }
);

// Wrap the entire deepResearch function with tracing
export const deepResearch = traceable(
  async ({
    query,
    originalQuery,
    breadth,
    depth,
    learnings = [],
    visitedUrls = [],
    onProgress,
  }: {
    query: string;
    originalQuery: string;
    breadth: number;
    depth: number;
    learnings?: string[];
    visitedUrls?: string[];
    onProgress?: (progress: ResearchProgress) => void;
  }): Promise<ResearchResult> => {
    const progress: ResearchProgress = {
      currentDepth: depth,
      totalDepth: depth,
      currentBreadth: breadth,
      totalBreadth: breadth,
      totalQueries: 0,
      completedQueries: 0,
    };

    const reportProgress = (update: Partial<ResearchProgress>) => {
      Object.assign(progress, update);
      onProgress?.(progress);
    };

    const serpQueries = await generateSerpQueries({
      query,
      originalQuery,
      learnings,
      numQueries: breadth,
    });

    reportProgress({
      totalQueries: serpQueries.length,
      currentQuery: serpQueries[0]?.query,
    });

    const limit = pLimit(ConcurrencyLimit);

    const results = await Promise.all(
      serpQueries.map(serpQuery =>
        limit(async () => {
          try {
            const result = await exa.searchAndContents(
              serpQuery.query + ':',        // trailing colon = quick keyword search
              {
                type: 'keyword',            // or 'neural' if you prefer semantic
                livecrawl: 'always',        // bypasses index & forces fresh crawl
                text: true,                 // include full body text
                numResults: 5,              // match former `limit: 5`
              }
            );

            // Collect URLs from this search
            const newUrls = compact(result.results.map(r => r.url));
            const newBreadth = Math.ceil(breadth / 2);
            const newDepth = depth - 1;

            const newLearnings = await processSerpResult({
              query: serpQuery.query,
              originalQuery,
              result,
              numFollowUpQuestions: newBreadth,
            });
            const allLearnings = [...learnings, ...newLearnings.learnings];
            const allUrls = [...visitedUrls, ...newUrls];

            if (newDepth > 0) {
              log(`Researching deeper, breadth: ${newBreadth}, depth: ${newDepth}`);

              reportProgress({
                currentDepth: newDepth,
                currentBreadth: newBreadth,
                completedQueries: progress.completedQueries + 1,
                currentQuery: serpQuery.query,
              });

              const nextQuery = `
              Previous research goal: ${serpQuery.researchGoal}
              Follow-up research directions: ${newLearnings.followUpQuestions.map(q => `\n${q}`).join('')}
            `.trim();

              return deepResearch({
                query: nextQuery,
                originalQuery,
                breadth: newBreadth,
                depth: newDepth,
                learnings: allLearnings,
                visitedUrls: allUrls,
                onProgress,
              });
            } else {
              reportProgress({
                currentDepth: 0,
                completedQueries: progress.completedQueries + 1,
                currentQuery: serpQuery.query,
              });
              return {
                learnings: allLearnings,
                visitedUrls: allUrls,
              };
            }
          } catch (e: any) {
            if (e.message && e.message.includes('Timeout')) {
              log(`Timeout error running query: ${serpQuery.query}: `, e);
            } else {
              log(`Error running query: ${serpQuery.query}: `, e);
            }
            return {
              learnings: [],
              visitedUrls: [],
            };
          }
        }),
      ),
    );

    return {
      learnings: Array.from(new Set(results.flatMap(r => r.learnings))),
      visitedUrls: Array.from(new Set(results.flatMap(r => r.visitedUrls))),
    };
  },
  { name: 'research_pipeline', run_type: 'chain' }
);

// Wrap the writeFinalReport function with tracing
export const tracedWriteFinalReport = traceable(
  writeFinalReport,
  { name: 'generate_report', run_type: 'chain' }
);

// Wrap the writeFinalAnswer function with tracing
export const tracedWriteFinalAnswer = traceable(
  writeFinalAnswer,
  { name: 'generate_answer', run_type: 'chain' }
);

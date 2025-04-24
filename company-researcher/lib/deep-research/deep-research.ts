import Exa, { SearchResponse } from "exa-js";
import { generateObject } from "ai";
import { compact } from "lodash-es";
import pLimit from "p-limit";
import { z } from "zod";

import { getModel, trimPrompt } from "./ai/providers";
import { systemPrompt } from "./prompt";
import { traceable } from "langsmith/traceable";
import { wrapOpenAI } from "langsmith/wrappers";

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
async function generateSerpQueries({
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
}) {
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
}

async function processSerpResult({
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
}) {
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
}

export async function writeFinalReport({
  prompt,
  originalQuery,
  learnings,
  visitedUrls,
}: {
  prompt: string;
  originalQuery: string;
  learnings: string[];
  visitedUrls: string[];
}) {
  const learningsString = learnings
    .map(learning => `<learning>\n${learning}\n</learning>`)
    .join('\n');

  const res = await generateObject({
    model: getModel(),
    system: systemPrompt(),
    prompt: trimPrompt(
      `Given the following prompt from the user, write a final report on the topic using the learnings from research. Make it as as detailed as possible, aim for 3 or more pages, include ALL the learnings from research:\n\n<prompt>${prompt}</prompt>\n\nOriginal research request from user: <original_query>${originalQuery}</original_query>\n\nHere are all the learnings from previous research:\n\n<learnings>\n${learningsString}\n</learnings>`,
    ),
    schema: z.object({
      reportMarkdown: z.string().describe('Final report on the topic in Markdown'),
    }),
  });

  // Append the visited URLs section to the report
  const urlsSection = `\n\n## Sources\n\n${visitedUrls.map(url => `- ${url}`).join('\n')}`;
  return res.object.reportMarkdown + urlsSection;
}

export async function writeFinalAnswer({
  prompt,
  originalQuery,
  learnings,
}: {
  prompt: string;
  originalQuery: string;
  learnings: string[];
}) {
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
}

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

import { NextResponse } from 'next/server';
import { deepResearch } from '../../../../deep-research/src/deep-research';

export type ResearchResult = {
  answer: string;
  learnings: string[];
  visitedUrls: string[];
};

import { writeFinalAnswer } from '../../../../deep-research/src/deep-research';

export async function POST(request: Request) {
  try {
    const { query, breadth = 3, depth = 3 } = await request.json();
    console.log('Received request with query:', query, 'breadth:', breadth, 'depth:', depth);

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('Starting research with query:', query);

    try {
      const deepResearchResult = await deepResearch({ query, originalQuery: query, breadth, depth });
      console.log('Research completed, generating answer...');
      const answer = await writeFinalAnswer({ 
        prompt: query, 
        originalQuery: query,
        learnings: deepResearchResult.learnings 
      });
      console.log('Answer generated successfully');

      const researchResult = {
        answer,
        learnings: deepResearchResult.learnings,
        visitedUrls: deepResearchResult.visitedUrls,
      };

      return NextResponse.json(researchResult);
    } catch (researchError) {
      console.error('Detailed research error:', researchError);
      if (researchError instanceof Error) {
        console.error('Error message:', researchError.message);
        console.error('Error stack:', researchError.stack);
      }
      throw researchError;
    }
  } catch (error) {
    console.error('Error during research:', error);
    let errorMessage = 'Unknown error occurred';
    let errorStack = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack || '';
      console.error('Error details:', { message: errorMessage, stack: errorStack });
      
      return NextResponse.json({ 
        error: 'Internal Server Error', 
        message: errorMessage,
        stack: errorStack 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: String(error)
    }, { status: 500 });
  }
}
import { Client } from 'langsmith';
import { traceable } from 'langsmith/traceable';
import { wrapOpenAI } from 'langsmith/wrappers';

// Create a LangSmith client
export const langsmithClient = new Client();

// Helper for wrapping functions with tracing
export function traceableFunction<T, Args extends any[]>(
  name: string,
  fn: (...args: Args) => Promise<T>,
  metadata: Record<string, any> = {}
) {
  return traceable(fn, {
    name,
    ...metadata
  });
}

// Helper for tracing LLM calls specifically
export function traceableLLM<T, Args extends any[]>(
  name: string,
  fn: (...args: Args) => Promise<T>,
  metadata: Record<string, any> = {}
) {
  return traceable(fn, {
    name,
    run_type: 'llm',
    ...metadata
  });
}

// Simple setup function to check environment
export function setupLangSmith() {
  // This function should be called at the application startup
  console.log('Setting up LangSmith tracing...');
  
  // Check if environment variables are set
  if (!process.env.LANGSMITH_API_KEY) {
    console.warn('LANGSMITH_API_KEY not set. LangSmith tracing will not work properly.');
  }
  
  if (process.env.LANGSMITH_TRACING !== 'true') {
    console.warn('LANGSMITH_TRACING not set to "true". LangSmith tracing may not be enabled.');
  }
  
  // Return instructions for setting up environment
  return {
    environmentSetup: `
    Set the following environment variables to enable LangSmith tracing:
    
    export LANGSMITH_TRACING=true
    export LANGSMITH_API_KEY=<your-langsmith-api-key>
    export LANGSMITH_PROJECT=<optional-project-name> # defaults to "default"
    `
  };
} 
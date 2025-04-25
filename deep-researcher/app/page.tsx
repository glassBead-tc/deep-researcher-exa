'use client';

import { useState } from 'react';
import { ResearchResult } from './api/research/route'; // Assuming the type is exported from the API route
import { CompanySummarySkeleton } from '../components/skeletons/ResearchSkeletons';
import { LoadingMessage } from '../components/ui/loading-message';
import { ResearchProgress, ResearchStage } from '../components/ui/research-progress';

export default function Home() {
  const [query, setQuery] = useState('');
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'report' | 'answer' | 'synthesis'>('report');
  const [researchStage, setResearchStage] = useState<ResearchStage>('querying');

  const handleReset = () => {
    setQuery('');
    setResearchResult(null);
    setError(null);
    setDisplayMode('report');
    // Optionally scroll to search input
    document.querySelector('input[type="text"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setResearchResult(null);
    setResearchStage('querying');

    try {
      console.log("Sending request with query:", query);

      // Stage 1: Querying
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      setResearchStage('researching');

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error:", errorData);
        throw new Error(`Error ${response.status}: ${errorData.message || response.statusText || 'Unknown error'}`);
      }

      // Stage 3: Synthesizing
      setResearchStage('synthesizing');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing

      const data = await response.json();
      console.log("Received response:", data);

      // Stage 4: Generating final report
      setResearchStage('generating');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing

      setResearchResult(data);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex relative min-h-screen flex-col items-center p-0 overflow-x-hidden">
      {/* background grid design texture code */}
      <div className="absolute inset-0 -z-10 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_0px),linear-gradient(to_bottom,#80808012_1px,transparent_0px)] bg-[size:60px_60px]"></div>

      {/* Header */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-brand-default flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <h1 
                onClick={handleReset}
                className="ml-3 text-2xl font-bold text-gray-900 hover:text-brand-default cursor-pointer transition-colors"
              >
                Deep Researcher
              </h1>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              Powered by
              <a href="https://exa.ai" target="_blank" rel="noopener noreferrer" className="flex items-center ml-1">
                <img src="/exa_logo.png" alt="Exa.ai" className="h-5 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-12 z-10 relative">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Research any topic in depth</h2>
          <p className="text-lg text-gray-600">Get comprehensive insights with AI-powered deep research</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (!isLoading) handleSearch(); }} className="w-full">
          <div className="flex w-full shadow-lg rounded-lg overflow-hidden border border-gray-200">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your research query..."
              className="flex-grow px-5 py-4 text-lg focus:outline-none w-full"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-4 bg-brand-default text-white font-medium text-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {isLoading && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <LoadingMessage
              message="Generating research report"
              estimatedTime="3-5 minutes"
            />
            <ResearchProgress currentStage={researchStage} />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600">
            <div className="font-medium">Error</div>
            <div>{error}</div>
          </div>
        )}

        {researchResult && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex px-6 pt-4">
                <button
                  onClick={() => setDisplayMode('report')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 ${
                    displayMode === 'report'
                      ? 'border-brand-default text-brand-default'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Report
                </button>
                <button
                  onClick={() => setDisplayMode('synthesis')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 ${
                    displayMode === 'synthesis'
                      ? 'border-brand-default text-brand-default'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Synthesis
                </button>
                <button
                  onClick={() => setDisplayMode('answer')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 ${
                    displayMode === 'answer'
                      ? 'border-brand-default text-brand-default'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Answer
                </button>
              </div>
            </div>

            <div className="p-6">
              {displayMode === 'report' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Learnings</h2>
                  <ul className="space-y-6">
                    {researchResult.learnings.map((learning: string, index: number) => (
                      <li key={index} className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                        {learning.split('\n\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className="mb-3 text-gray-800 leading-relaxed">{paragraph}</p>
                        ))}
                      </li>
                    ))}
                  </ul>

                  <h2 className="text-xl font-bold mt-8 mb-4">Sources</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ul className="space-y-2">
                      {researchResult.visitedUrls.map((url: string, index: number) => (
                        <li key={index} className="truncate">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-default hover:underline">
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {displayMode === 'answer' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Answer</h2>
                  <div className="prose max-w-none whitespace-pre-wrap bg-gray-50 p-6 rounded-lg">
                    {researchResult.answer.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-gray-800 leading-relaxed">{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {displayMode === 'synthesis' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Synthesized Learnings</h2>
                  <div className="prose max-w-none whitespace-pre-wrap bg-gray-50 p-6 rounded-lg">
                    {researchResult.synthesis.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-gray-800 leading-relaxed">{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

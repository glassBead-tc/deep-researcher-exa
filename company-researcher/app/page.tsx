'use client';

import { useState } from 'react';
import { ResearchResult } from './api/research/route'; // Assuming the type is exported from the API route
import { CompanySummarySkeleton } from '../components/skeletons/ResearchSkeletons';

export default function Home() {
  const [query, setQuery] = useState('');
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'report' | 'answer' | 'synthesis'>('report');

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setResearchResult(null);

    try {
      console.log("Sending request with query:", query);
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

      const data = await response.json();
      console.log("Received response:", data);
      setResearchResult(data);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex relative min-h-screen flex-col items-center justify-center p-6">
      {/* background grid design texture code */}
      <div className="absolute inset-0 -z-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_0px),linear-gradient(to_bottom,#80808012_1px,transparent_0px)] bg-[size:60px_60px]"></div>

      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white lg:static lg:h-auto lg:w-auto lg:bg-none">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter research query"
            className="border p-2 rounded text-black"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="ml-2 p-2 border rounded bg-blue-500 text-white disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div className="z-10 w-full max-w-5xl mt-8">
        {isLoading && <CompanySummarySkeleton />}
        {error && <div className="text-red-500">Error: {error}</div>}

        {researchResult && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setDisplayMode('report')}
                className={`mr-2 p-2 rounded ${displayMode === 'report' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
              >
                Report
              </button>
              <button
                onClick={() => setDisplayMode('synthesis')}
                className={`mr-2 p-2 rounded ${displayMode === 'synthesis' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
              >
                Synthesis
              </button>
              <button
                onClick={() => setDisplayMode('answer')}
                className={`p-2 rounded ${displayMode === 'answer' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
              >
                Answer
              </button>
            </div>

            {displayMode === 'report' && (
              <div>
                <h2 className="text-xl font-bold mb-2">Learnings:</h2>
                <ul>
                  {researchResult.learnings.map((learning: string, index: number) => (
                    <li key={index} className="mb-2">{learning}</li>
                  ))}
                </ul>

                <h2 className="text-xl font-bold mt-4 mb-2">Visited URLs:</h2>
                <ul>
                  {researchResult.visitedUrls.map((url: string, index: number) => (
                    <li key={index}>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {displayMode === 'answer' && (
              <div>
                <h2 className="text-xl font-bold mb-2">Answer:</h2>
                <p>{researchResult.answer}</p>
              </div>
            )}

            {displayMode === 'synthesis' && (
              <div>
                <h2 className="text-xl font-bold mb-2">Synthesized Learnings:</h2>
                <div className="prose max-w-none">
                  {researchResult.synthesis}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
import React from "react";

export type ResearchStage = 
  | "querying" 
  | "researching" 
  | "synthesizing" 
  | "generating";

interface ResearchProgressProps {
  currentStage: ResearchStage;
}

interface StageInfo {
  title: string;
  description: string;
  estimatedTime: string;
}

export function ResearchProgress({ currentStage }: ResearchProgressProps) {
  const stages: Record<ResearchStage, StageInfo> = {
    querying: {
      title: "Initiating Research",
      description: "Setting up research parameters and planning search strategy",
      estimatedTime: "30 seconds"
    },
    researching: {
      title: "Gathering Information",
      description: "Searching the web and collecting relevant data sources",
      estimatedTime: "1-2 minutes"
    },
    synthesizing: {
      title: "Synthesizing Research",
      description: "Analyzing and organizing discovered information",
      estimatedTime: "1 minute"
    },
    generating: {
      title: "Generating Final Report",
      description: "Creating comprehensive, well-structured analysis",
      estimatedTime: "30-60 seconds"
    }
  };

  const stageOrder: ResearchStage[] = ["querying", "researching", "synthesizing", "generating"];
  const currentStageIndex = stageOrder.indexOf(currentStage);

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <h3 className="text-lg font-medium mb-4">Research Progress</h3>
      <div className="space-y-4">
        {stageOrder.map((stage, index) => {
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex;
          const info = stages[stage];
          
          return (
            <div 
              key={stage} 
              className={`p-4 border rounded-lg transition-all ${
                isActive ? 'border-blue-500 bg-blue-50' : 
                isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                  isActive ? 'bg-blue-500 text-white' : 
                  isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}>
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{info.title}</h4>
                  <p className="text-sm text-gray-600">{info.description}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {isActive && <span>~{info.estimatedTime}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center mt-4 text-sm text-gray-500">
        Total estimated time: 3-5 minutes
      </p>
    </div>
  );
} 
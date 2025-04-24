import React from "react";

interface LoadingMessageProps {
  message?: string;
  estimatedTime?: string;
}

export function LoadingMessage({
  message = "Generating report",
  estimatedTime = "3-5 minutes",
}: LoadingMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
      <div className="w-16 h-16 relative">
        <div className="animate-spin absolute w-full h-full border-4 border-t-blue-500 border-opacity-50 rounded-full"></div>
      </div>
      <h3 className="text-xl font-medium">{message}</h3>
      <p className="text-muted-foreground">
        This process takes approximately {estimatedTime}. Please wait...
      </p>
    </div>
  );
} 
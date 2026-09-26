import React from 'react';

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({ lines = 4, className = '' }: LoadingSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading content..."
      className={`space-y-3 animate-pulse ${className}`}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 rounded"
          style={{ width: i === lines - 1 ? '60%' : i % 2 === 0 ? '100%' : '90%' }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

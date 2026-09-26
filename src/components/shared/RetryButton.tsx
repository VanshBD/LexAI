import React from 'react';

interface RetryButtonProps {
  onRetry: () => void;
  isLoading?: boolean;
}

export function RetryButton({ onRetry, isLoading = false }: RetryButtonProps) {
  return (
    <button
      type="button"
      onClick={onRetry}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-md transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none disabled:opacity-50"
    >
      <svg
        className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <span>{isLoading ? 'Retrying...' : 'Retry'}</span>
    </button>
  );
}

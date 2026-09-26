import React from 'react';
import { RetryButton } from './RetryButton';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  isLoading?: boolean;
}

export function ErrorBanner({ message, onRetry, isLoading }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-800 text-sm"
    >
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">{message}</span>
      </div>
      {onRetry && <RetryButton onRetry={onRetry} isLoading={isLoading} />}
    </div>
  );
}

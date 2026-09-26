'use client';

import React from 'react';

interface StreamingTextProps {
  content: string;
  isStreaming?: boolean;
  ariaLiveMode?: 'polite' | 'assertive';
  className?: string;
}

export function StreamingText({
  content,
  isStreaming = false,
  ariaLiveMode = 'polite',
  className = '',
}: StreamingTextProps) {
  return (
    <div
      aria-live={ariaLiveMode}
      aria-atomic="false"
      className={`relative inline-block whitespace-pre-wrap leading-relaxed ${className}`}
    >
      {content}
      {isStreaming && (
        <span
          aria-hidden="true"
          className="inline-block w-2 h-4 ml-1 bg-indigo-600 animate-blink align-middle"
        />
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { StreamingText } from '@/components/shared/StreamingText';

interface SummarySectionProps {
  title: string;
  content: string;
  isStreaming?: boolean;
}

export function SummarySection({ title, content, isStreaming }: SummarySectionProps) {
  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm space-y-2">
      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
        {title}
      </h4>
      <div className="text-xs sm:text-sm text-slate-600">
        <StreamingText content={content} isStreaming={isStreaming} />
      </div>
    </div>
  );
}

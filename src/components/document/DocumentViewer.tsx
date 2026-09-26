'use client';

import React from 'react';
import { ParsedDocument } from '@/types/document';
import { HighlightedClause } from '@/types/common';
import { ClauseHighlighter } from '@/components/clauses/ClauseHighlighter';

interface DocumentViewerProps {
  document: ParsedDocument | null;
  highlightedClauses?: HighlightedClause[];
  onClauseClick?: (clause: HighlightedClause) => void;
  syncScrollRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function DocumentViewer({
  document,
  highlightedClauses = [],
  onClauseClick,
  syncScrollRef,
  onScroll,
}: DocumentViewerProps) {
  if (!document) {
    return (
      <div className="h-96 flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
        <svg className="w-12 h-12 mb-2 stroke-current opacity-40" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm font-medium">No document loaded</p>
        <p className="text-xs">Upload a file to view extracted text and analysis</p>
      </div>
    );
  }

  return (
    <div
      ref={syncScrollRef}
      onScroll={onScroll}
      tabIndex={0}
      role="region"
      aria-label={`Document text viewer for ${document.name}`}
      className="h-[550px] overflow-y-auto p-6 bg-white border border-slate-200 rounded-xl shadow-inner font-serif text-slate-800 text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
    >
      <ClauseHighlighter
        text={document.text}
        clauses={highlightedClauses}
        onClauseClick={onClauseClick}
      />
    </div>
  );
}

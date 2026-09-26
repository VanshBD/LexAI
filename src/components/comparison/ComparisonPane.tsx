'use client';

import React from 'react';
import { ComparisonHighlight } from '@/types/ai';

interface ComparisonPaneProps {
  documentName: string;
  text: string;
  highlights: ComparisonHighlight[];
  scrollRef: React.RefObject<HTMLDivElement>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function ComparisonPane({
  documentName,
  text,
  highlights,
  scrollRef,
  onScroll,
}: ComparisonPaneProps) {
  return (
    <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 truncate" title={documentName}>
          {documentName}
        </h4>
        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
          {highlights.length} discrepancies
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 p-4 overflow-y-auto font-serif text-xs leading-relaxed space-y-4 max-h-[500px]"
      >
        <p className="whitespace-pre-wrap text-slate-700">{text}</p>

        {highlights.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
            <h5 className="font-sans font-bold text-[11px] text-slate-500 uppercase tracking-wide">
              Document Discrepancies
            </h5>
            {highlights.map((h, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-lg border font-sans text-xs ${
                  h.type === 'conflict'
                    ? 'bg-purple-50 border-purple-200 text-purple-900'
                    : h.type === 'missing'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1 font-bold text-[10px] uppercase">
                  <span>{h.type}</span>
                  {h.matchedClauseText && <span>Matches counterpart</span>}
                </div>
                <p className="italic mb-1 font-serif">&ldquo;{h.clauseText}&rdquo;</p>
                <p className="font-sans text-[11px] font-medium">{h.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

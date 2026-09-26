import React from 'react';
import { ParsedDocument } from '@/types/document';

interface DocumentMetaProps {
  document: ParsedDocument | null;
  onRemove?: () => void;
}

export function DocumentMeta({ document, onRemove }: DocumentMetaProps) {
  if (!document) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded font-semibold uppercase text-[10px]">
          {document.format}
        </span>
        <div className="truncate">
          <span className="font-semibold text-slate-800 block truncate" title={document.name}>
            {document.name}
          </span>
          <span className="text-slate-500">
            {document.wordCount.toLocaleString()} words
            {document.pageCount ? ` • ${document.pageCount} pages` : ''}
          </span>
        </div>
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-red-600 transition-colors p-1"
          aria-label={`Remove document ${document.name}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

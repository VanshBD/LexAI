'use client';

import React, { useState } from 'react';

export type ExportFormat = 'pdf' | 'txt' | 'png';

interface ExportButtonProps {
  label?: string;
  formats: ExportFormat[];
  onExport: (format: ExportFormat) => Promise<void> | void;
  isDisabled?: boolean;
}

export function ExportButton({
  label = 'Export',
  formats,
  onExport,
  isDisabled = false,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSelect = async (format: ExportFormat) => {
    setIsOpen(false);
    setIsExporting(true);
    try {
      await onExport(format);
    } finally {
      setIsExporting(false);
    }
  };

  if (formats.length === 1) {
    const singleFormat = formats[0];
    return (
      <button
        type="button"
        disabled={isDisabled || isExporting}
        onClick={() => handleSelect(singleFormat)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>{isExporting ? 'Exporting...' : `${label} (${singleFormat.toUpperCase()})`}</span>
      </button>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={isDisabled || isExporting}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>{isExporting ? 'Exporting...' : label}</span>
        <svg className="w-3.5 h-3.5 ml-0.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-slate-200 z-30 py-1"
        >
          {formats.map((fmt) => (
            <button
              key={fmt}
              role="menuitem"
              onClick={() => handleSelect(fmt)}
              className="w-full text-left px-4 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors capitalize font-medium"
            >
              Export as {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

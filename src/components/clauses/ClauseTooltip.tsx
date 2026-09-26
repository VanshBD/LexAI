'use client';

import React from 'react';
import { HighlightedClause } from '@/types/common';
import { RISK_COLOR_MAP } from '@/lib/utils/colorUtils';

interface ClauseTooltipProps {
  clause: HighlightedClause | null;
  position?: { x: number; y: number };
}

export function ClauseTooltip({ clause }: ClauseTooltipProps) {
  if (!clause) return null;

  const colors = RISK_COLOR_MAP[clause.riskLevel] || RISK_COLOR_MAP.moderate;

  return (
    <div
      role="tooltip"
      aria-describedby={`tooltip-${clause.id}`}
      className="p-3 bg-white rounded-lg shadow-xl border border-slate-200 text-xs space-y-2 max-w-sm transition-all"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
        <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
          {clause.category.replace(/-/g, ' ')}
        </span>
        <span
          style={{ backgroundColor: colors.bg, color: colors.text }}
          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
        >
          {clause.riskLevel}
        </span>
      </div>

      <p className="text-slate-600 italic">
        &ldquo;{clause.summary || clause.text}&rdquo;
      </p>

      {clause.isUnfair && (
        <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 p-1.5 rounded font-semibold text-[11px]">
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Flagged as Unusual or One-Sided</span>
        </div>
      )}
    </div>
  );
}

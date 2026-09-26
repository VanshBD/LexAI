import React from 'react';
import { HighlightedClause } from '@/types/common';
import { RISK_COLOR_MAP } from '@/lib/utils/colorUtils';

interface ClauseRiskHeaderProps {
  clauses: HighlightedClause[];
}

export function ClauseRiskHeader({ clauses }: ClauseRiskHeaderProps) {
  const criticalCount = clauses.filter((c) => c.riskLevel === 'critical').length;
  const moderateCount = clauses.filter((c) => c.riskLevel === 'moderate').length;
  const lowCount = clauses.filter((c) => c.riskLevel === 'low').length;

  return (
    <div
      role="region"
      aria-label="Risk assessment overview"
      className="flex flex-wrap items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg text-xs"
    >
      <span className="font-bold text-slate-700">Risk Overview:</span>

      <span
        style={{
          backgroundColor: RISK_COLOR_MAP.critical.bg,
          color: RISK_COLOR_MAP.critical.text,
          border: `1px solid ${RISK_COLOR_MAP.critical.border}`,
        }}
        className="px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5"
      >
        <span>●</span>
        <span>{criticalCount} Critical</span>
      </span>

      <span
        style={{
          backgroundColor: RISK_COLOR_MAP.moderate.bg,
          color: RISK_COLOR_MAP.moderate.text,
          border: `1px solid ${RISK_COLOR_MAP.moderate.border}`,
        }}
        className="px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5"
      >
        <span>●</span>
        <span>{moderateCount} Moderate</span>
      </span>

      <span
        style={{
          backgroundColor: RISK_COLOR_MAP.low.bg,
          color: RISK_COLOR_MAP.low.text,
          border: `1px solid ${RISK_COLOR_MAP.low.border}`,
        }}
        className="px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5"
      >
        <span>●</span>
        <span>{lowCount} Standard / Low</span>
      </span>
    </div>
  );
}

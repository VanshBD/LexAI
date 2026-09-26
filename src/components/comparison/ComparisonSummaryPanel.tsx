import React from 'react';
import { ComparisonResult } from '@/types/ai';

interface ComparisonSummaryPanelProps {
  comparisonResult: ComparisonResult;
}

export function ComparisonSummaryPanel({ comparisonResult }: ComparisonSummaryPanelProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <span className="block text-2xl font-black text-blue-700">
          {comparisonResult.totalDifferences}
        </span>
        <span className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
          Differences
        </span>
      </div>

      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
        <span className="block text-2xl font-black text-purple-700">
          {comparisonResult.totalConflicts}
        </span>
        <span className="text-xs font-semibold text-purple-900 uppercase tracking-wide">
          Direct Conflicts
        </span>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
        <span className="block text-2xl font-black text-amber-700">
          {comparisonResult.totalMissing}
        </span>
        <span className="text-xs font-semibold text-amber-900 uppercase tracking-wide">
          Missing Clauses
        </span>
      </div>
    </div>
  );
}

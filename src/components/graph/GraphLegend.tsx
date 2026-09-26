import React from 'react';
import { RISK_COLOR_MAP, CONFLICT_EDGE_COLOR } from '@/lib/utils/colorUtils';

interface GraphLegendProps {
  showComparisonColors?: boolean;
}

export function GraphLegend({ showComparisonColors = false }: GraphLegendProps) {
  return (
    <div
      role="region"
      aria-label="Risk DNA Graph Legend"
      className="flex flex-wrap items-center gap-4 p-2.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg text-xs shadow-sm"
    >
      <span className="font-bold text-slate-700">Legend:</span>

      <div className="flex items-center gap-1.5">
        <span
          style={{ backgroundColor: RISK_COLOR_MAP.critical.border }}
          className="w-3.5 h-3.5 rounded-full inline-block"
        />
        <span className="text-slate-600 font-medium">Critical Risk</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span
          style={{ backgroundColor: RISK_COLOR_MAP.moderate.border }}
          className="w-3.5 h-3.5 rounded-full inline-block"
        />
        <span className="text-slate-600 font-medium">Moderate Concern</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span
          style={{ backgroundColor: RISK_COLOR_MAP.low.border }}
          className="w-3.5 h-3.5 rounded-full inline-block"
        />
        <span className="text-slate-600 font-medium">Low Risk / Standard</span>
      </div>

      {showComparisonColors && (
        <div className="flex items-center gap-1.5">
          <span
            style={{ backgroundColor: CONFLICT_EDGE_COLOR }}
            className="w-5 h-1 inline-block rounded"
          />
          <span className="text-purple-700 font-medium">Direct Conflict</span>
        </div>
      )}
    </div>
  );
}

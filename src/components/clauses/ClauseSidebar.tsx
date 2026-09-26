'use client';

import React from 'react';
import { HighlightedClause, ClauseCategory } from '@/types/common';
import { RISK_COLOR_MAP } from '@/lib/utils/colorUtils';

interface ClauseSidebarProps {
  clauses: HighlightedClause[];
  selectedClauseId?: string | null;
  onClauseSelect: (clauseId: string) => void;
}

export function ClauseSidebar({
  clauses,
  selectedClauseId,
  onClauseSelect,
}: ClauseSidebarProps) {
  // Group clauses by category
  const categories = Array.from(new Set(clauses.map((c) => c.category))) as ClauseCategory[];

  return (
    <aside
      aria-label="Document clauses grouped by category"
      className="w-full h-[550px] bg-white border border-slate-200 rounded-xl p-4 space-y-4 overflow-y-auto shadow-sm"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Clauses by Category
        </h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
          {clauses.length}
        </span>
      </div>

      {categories.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No clauses analyzed yet.</p>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryClauses = clauses.filter((c) => c.category === category);

            return (
              <div key={category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="capitalize">{category.replace(/-/g, ' ')}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                    {categoryClauses.length}
                  </span>
                </div>

                <div className="space-y-1">
                  {categoryClauses.map((clause) => {
                    const isSelected = selectedClauseId === clause.id;
                    const colors = RISK_COLOR_MAP[clause.riskLevel] || RISK_COLOR_MAP.moderate;

                    return (
                      <button
                        key={clause.id}
                        type="button"
                        onClick={() => onClauseSelect(clause.id)}
                        aria-current={isSelected ? 'true' : undefined}
                        className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-semibold text-slate-800 truncate">
                            {clause.summary || 'Clause'}
                          </span>
                          <span
                            style={{ backgroundColor: colors.bg, color: colors.text }}
                            className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase"
                          >
                            {clause.riskLevel}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] line-clamp-2">
                          {clause.text}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

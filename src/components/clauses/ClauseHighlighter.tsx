'use client';

import React from 'react';
import { HighlightedClause } from '@/types/common';
import { RISK_COLOR_MAP } from '@/lib/utils/colorUtils';

interface ClauseHighlighterProps {
  text: string;
  clauses: HighlightedClause[];
  onClauseHover?: (clause: HighlightedClause | null) => void;
  onClauseClick?: (clause: HighlightedClause) => void;
}

export function ClauseHighlighter({
  text,
  clauses,
  onClauseHover,
  onClauseClick,
}: ClauseHighlighterProps) {
  if (!clauses || clauses.length === 0) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  // Filter and sort clauses with valid offsets
  const sortedClauses = [...clauses]
    .filter((c) => c.endOffset > c.startOffset && c.startOffset >= 0)
    .sort((a, b) => a.startOffset - b.startOffset);

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedClauses.forEach((clause, idx) => {
    // If this clause overlaps with the previous one, skip or adjust
    if (clause.startOffset < lastIndex) {
      return;
    }

    // Plain text before this clause
    if (clause.startOffset > lastIndex) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex, clause.startOffset)}
        </span>
      );
    }

    const colors = RISK_COLOR_MAP[clause.riskLevel] || RISK_COLOR_MAP.moderate;
    const clauseText = text.slice(clause.startOffset, clause.endOffset);

    elements.push(
      <mark
        key={`clause-${clause.id}-${idx}`}
        data-clause-id={clause.id}
        role="mark"
        tabIndex={0}
        aria-label={`${clause.category} clause, risk level: ${clause.riskLevel}`}
        onMouseEnter={() => onClauseHover && onClauseHover(clause)}
        onMouseLeave={() => onClauseHover && onClauseHover(null)}
        onFocus={() => onClauseHover && onClauseHover(clause)}
        onBlur={() => onClauseHover && onClauseHover(null)}
        onClick={() => onClauseClick && onClauseClick(clause)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onClauseClick) onClauseClick(clause);
          }
        }}
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          borderBottom: `2px solid ${colors.border}`,
        }}
        className="px-1 py-0.5 rounded cursor-pointer transition-colors focus:ring-2 focus:ring-indigo-500 font-medium inline"
      >
        {clauseText}
      </mark>
    );

    lastIndex = clause.endOffset;
  });

  if (lastIndex < text.length) {
    elements.push(<span key={`text-end`}>{text.slice(lastIndex)}</span>);
  }

  return <div className="whitespace-pre-wrap leading-relaxed text-sm">{elements}</div>;
}

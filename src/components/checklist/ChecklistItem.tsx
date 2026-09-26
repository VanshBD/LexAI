'use client';

import React from 'react';
import { ChecklistEntry } from '@/types/checklist';

interface ChecklistItemProps {
  entry: ChecklistEntry;
  onToggle: (id: string) => void;
}

export function ChecklistItem({ entry, onToggle }: ChecklistItemProps) {
  const inputId = `chk-${entry.id}`;

  return (
    <div className="flex items-start gap-3 p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors">
      <input
        type="checkbox"
        id={inputId}
        checked={entry.checked}
        onChange={() => onToggle(entry.id)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
      />
      <label htmlFor={inputId} className="flex-1 text-xs sm:text-sm cursor-pointer select-none">
        <span className={entry.checked ? 'line-through text-slate-400' : 'text-slate-800'}>
          {entry.text}
        </span>
        {entry.clauseRef && (
          <span className="block mt-1 text-[11px] font-medium text-indigo-600">
            Reference: {entry.clauseRef}
          </span>
        )}
      </label>
    </div>
  );
}

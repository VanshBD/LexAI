'use client';

import React from 'react';
import { FeatureTab } from '@/types/common';
import { useDocumentStore } from '@/store/documentStore';

interface FeatureTabsProps {
  hasComparisonDoc?: boolean;
}

const TABS: Array<{ id: FeatureTab; label: string; icon: string; requiresDoc?: boolean; requiresComparison?: boolean }> = [
  { id: 'summary', label: 'Plain Summary', icon: '📝', requiresDoc: true },
  { id: 'risk-graph', label: 'Risk DNA Graph', icon: '🧬', requiresDoc: true },
  { id: 'clauses', label: 'Key Clauses', icon: '🔍', requiresDoc: true },
  { id: 'qa', label: 'Document Q&A', icon: '💬', requiresDoc: true },
  { id: 'checklist', label: 'Action Checklist', icon: '✅', requiresDoc: true },
  { id: 'next-steps', label: 'Next Steps', icon: '🚀', requiresDoc: true },
  { id: 'attorney-pack', label: 'Attorney Prep Pack', icon: '💼', requiresDoc: true },
  { id: 'comparison', label: 'Document Comparison', icon: '⚖️', requiresComparison: true },
];

export function FeatureTabs({ hasComparisonDoc = false }: FeatureTabsProps) {
  const activeTab = useDocumentStore((state) => state.activeTab);
  const setActiveTab = useDocumentStore((state) => state.setActiveTab);
  const documents = useDocumentStore((state) => state.documents);
  const hasFirstDoc = documents.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      const nextIndex = (index + 1) % TABS.length;
      setActiveTab(TABS[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      const prevIndex = (index - 1 + TABS.length) % TABS.length;
      setActiveTab(TABS[prevIndex].id);
    }
  };

  return (
    <div className="border-b border-slate-200 bg-white">
      <div
        role="tablist"
        aria-label="LexAI Feature Tabs"
        className="flex overflow-x-auto no-scrollbar gap-1 p-1 max-w-7xl mx-auto"
      >
        {TABS.map((tab, idx) => {
          const isSelected = activeTab === tab.id;
          const isDisabled = tab.requiresComparison ? !hasComparisonDoc : tab.requiresDoc && !hasFirstDoc;

          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={isSelected}
              disabled={isDisabled}
              tabIndex={isSelected ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                isSelected
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200'
                  : isDisabled
                  ? 'text-slate-300 cursor-not-allowed opacity-60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.requiresComparison && !hasComparisonDoc && (
                <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                  2 Docs Req
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

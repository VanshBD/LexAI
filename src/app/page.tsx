'use client';

import React, { useEffect, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { DocumentUpload } from '@/components/document/DocumentUpload';
import { DocumentMeta } from '@/components/document/DocumentMeta';
import { DocumentViewer } from '@/components/document/DocumentViewer';
import { FeatureTabs } from '@/components/tabs/FeatureTabs';

import { SummaryPanel } from '@/components/summary/SummaryPanel';
import { RiskDNAGraph } from '@/components/graph/RiskDNAGraph';
import { QAChat } from '@/components/qa/QAChat';
import { ChecklistPanel } from '@/components/checklist/ChecklistPanel';
import { NextStepsPanel } from '@/components/next-steps/NextStepsPanel';
import { AttorneyPackPanel } from '@/components/attorney/AttorneyPackPanel';
import { ComparisonView } from '@/components/comparison/ComparisonView';
import { ClauseSidebar } from '@/components/clauses/ClauseSidebar';
import { ClauseRiskHeader } from '@/components/clauses/ClauseRiskHeader';
import { ClauseTooltip } from '@/components/clauses/ClauseTooltip';
import { HighlightedClause } from '@/types/common';
import { RiskGraphData } from '@/types/graph';

export default function Home() {
  const documents = useDocumentStore((state) => state.documents);
  const clearDocument = useDocumentStore((state) => state.clearDocument);
  const activeTab = useDocumentStore((state) => state.activeTab);
  const highlightedClauses = useDocumentStore((state) => state.highlightedClauses[0]);
  const setRiskGraph = useDocumentStore((state) => state.setRiskGraph);
  const setHighlightedClauses = useDocumentStore((state) => state.setHighlightedClauses);
  const riskGraph = useDocumentStore((state) => state.riskGraphs[0]);

  const [hoveredClause, setHoveredClause] = useState<HighlightedClause | null>(null);
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);

  const docA = documents[0];
  const docB = documents[1];
  const hasDoc = Boolean(docA);

  // Eagerly pre-populate risk graph and highlighted clauses as soon as document A is loaded
  useEffect(() => {
    if (!docA) return;
    if (riskGraph) return;

    fetch('/api/risk-graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentText: docA.text,
        documentId: docA.id,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RiskGraphData | null) => {
        if (!data) return;
        setRiskGraph(0, data);

        const clauses = data.nodes.map((n) => {
          const text = n.data.fullText || n.data.shortText || '';
          let startOffset = docA.text.indexOf(text);
          let endOffset = startOffset >= 0 ? startOffset + text.length : 0;

          if (startOffset === -1 && text.length > 20) {
            const snippet = text.slice(0, 30);
            startOffset = docA.text.indexOf(snippet);
            if (startOffset >= 0) {
              endOffset = startOffset + text.length;
            }
          }

          if (startOffset === -1) {
            startOffset = 0;
            endOffset = 0;
          }

          const lower = (n.data.title + ' ' + text).toLowerCase();
          let category: 'obligations' | 'rights' | 'limitations-of-liability' | 'termination' | 'indemnification' | 'jurisdiction' | 'unusual-or-one-sided' = 'obligations';

          if (lower.includes('indemnif') || lower.includes('hold harmless')) {
            category = 'indemnification';
          } else if (lower.includes('liability') || lower.includes('damages') || lower.includes('limitation of liability')) {
            category = 'limitations-of-liability';
          } else if (lower.includes('terminat') || lower.includes('cancel') || lower.includes('expire') || lower.includes('deadline')) {
            category = 'termination';
          } else if (lower.includes('jurisdiction') || lower.includes('governing law') || lower.includes('court') || lower.includes('dispute')) {
            category = 'jurisdiction';
          } else if (lower.includes('right') || lower.includes('license') || lower.includes('grant') || lower.includes('refund')) {
            category = 'rights';
          } else if (lower.includes('unusual') || lower.includes('sole discretion') || lower.includes('without limitation') || n.data.riskLevel === 'critical') {
            category = 'unusual-or-one-sided';
          } else {
            category = 'obligations';
          }

          return {
            id: n.data.clauseId,
            text: text || n.data.title,
            startOffset,
            endOffset,
            category,
            riskLevel: n.data.riskLevel,
            summary: n.data.riskReason || n.data.plainSummary,
            isUnfair: n.data.riskLevel === 'critical' || category === 'unusual-or-one-sided',
          };
        });
        setHighlightedClauses(0, clauses);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docA?.id]);

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
          <span>✨</span>
          <span>Google GDG HackToSkill 2026 Submission</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Understand Any Legal Document in Seconds
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Powered by Google Gemini 1.5. Analyze complex contracts, visualize risk networks, uncover hidden obligations, and prepare for legal consultations with zero data storage.
        </p>
      </section>

      {/* Upload & Document Slots */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Primary Document
            </h3>
            {docA && (
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span>●</span> Ready for analysis
              </span>
            )}
          </div>

          {!docA ? (
            <DocumentUpload slot={0} label="Upload Primary Agreement" />
          ) : (
            <DocumentMeta document={docA} onRemove={() => clearDocument(0)} />
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Comparison Document (Optional)
            </h3>
            {docB && (
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span>●</span> Comparison ready
              </span>
            )}
          </div>

          {!docB ? (
            <DocumentUpload
              slot={1}
              label="Upload Second Document to Compare"
              isDisabled={!docA}
            />
          ) : (
            <DocumentMeta document={docB} onRemove={() => clearDocument(1)} />
          )}
        </div>
      </section>

      {/* Feature Navigation Tabs */}
      {hasDoc && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <FeatureTabs hasComparisonDoc={Boolean(docA && docB)} />

          <div className="p-6">
            {activeTab === 'summary' && <SummaryPanel slot={0} />}

            {activeTab === 'risk-graph' && <RiskDNAGraph />}

            {activeTab === 'clauses' && (
              <div className="space-y-4">
                <ClauseRiskHeader clauses={highlightedClauses} />
                <div className="relative">
                  <ClauseTooltip clause={hoveredClause} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3">
                    <DocumentViewer
                      document={docA}
                      highlightedClauses={highlightedClauses}
                      onClauseClick={(c) => setSelectedClauseId(c.id)}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <ClauseSidebar
                      clauses={highlightedClauses}
                      selectedClauseId={selectedClauseId}
                      onClauseSelect={(id) => setSelectedClauseId(id)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'qa' && <QAChat />}

            {activeTab === 'checklist' && <ChecklistPanel />}

            {activeTab === 'next-steps' && <NextStepsPanel />}

            {activeTab === 'attorney-pack' && <AttorneyPackPanel />}

            {activeTab === 'comparison' && <ComparisonView />}
          </div>
        </section>
      )}
    </div>
  );
}

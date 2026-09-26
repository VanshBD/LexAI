'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import html2canvas from 'html2canvas';
import { useDocumentStore } from '@/store/documentStore';
import { useSessionCache } from '@/hooks/useSessionCache';
import { useAccessibility } from '@/hooks/useAccessibility';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { GraphLegend } from './GraphLegend';
import { GraphAccessibilityTable } from './GraphAccessibilityTable';
import { ClauseNodeData, RiskGraphData } from '@/types/graph';
import { RISK_COLOR_MAP } from '@/lib/utils/colorUtils';

const RiskDNAGraphInner = dynamic(() => import('./RiskDNAGraphInner'), {
  loading: () => <LoadingSkeleton lines={8} className="h-[550px] p-6 bg-slate-50 rounded-xl" />,
  ssr: false,
});

export function RiskDNAGraph() {
  const document = useDocumentStore((state) => state.documents[0]);
  const comparisonDoc = useDocumentStore((state) => state.documents[1]);
  const riskGraph = useDocumentStore((state) => state.riskGraphs[0]);
  const setRiskGraph = useDocumentStore((state) => state.setRiskGraph);
  const setHighlightedClauses = useDocumentStore((state) => state.setHighlightedClauses);

  const { isAccessibilityMode } = useAccessibility();
  const [selectedClause, setSelectedClause] = useState<ClauseNodeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const cacheKey = document ? `lexai_riskgraph_${document.id}` : '';
  const { get: getCachedGraph, set: setCachedGraph } = useSessionCache<RiskGraphData>(cacheKey);

  const fetchGraph = async () => {
    if (!document) return;

    // Check session storage cache
    const cached = getCachedGraph();
    if (cached) {
      setRiskGraph(0, cached);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/risk-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: document.text,
          documentId: document.id,
          comparisonDocumentText: comparisonDoc?.text,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to analyze risk graph');
      }

      const data: RiskGraphData = await res.json();
      setRiskGraph(0, data);
      setCachedGraph(data);

      // Populate highlightedClauses for DocumentViewer sync
      const clausesForHighlight = data.nodes.map((n) => {
        const text = n.data.fullText || n.data.shortText || '';
        let startOffset = document.text.indexOf(text);
        let endOffset = startOffset >= 0 ? startOffset + text.length : 0;

        if (startOffset === -1 && text.length > 20) {
          const snippet = text.slice(0, 30);
          startOffset = document.text.indexOf(snippet);
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
      setHighlightedClauses(0, clausesForHighlight);
    } catch (err: any) {
      setError(err?.message || 'Error loading risk DNA graph');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (document && !riskGraph) {
      fetchGraph();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id]);

  const handleExportPng = async () => {
    if (!graphContainerRef.current) return;
    try {
      const canvas = await html2canvas(graphContainerRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const a = window.document.createElement('a');
      a.href = imgData;
      a.download = `risk-dna-graph-${document?.name || 'doc'}.png`;
      a.click();
    } catch {
      alert('Failed to export graph PNG');
    }
  };

  if (!document) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
        Upload a document to generate and explore the interactive Legal Risk DNA Graph.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            Legal Risk DNA Graph
          </h3>
          <p className="text-xs text-slate-500">
            Interactive node map showing clause severity, cross-clause relationships, and dependencies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPng}
            disabled={!riskGraph || isLoading}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>🖼️ Export Graph PNG</span>
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchGraph} isLoading={isLoading} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <GraphLegend showComparisonColors={Boolean(comparisonDoc)} />
        <span className="text-xs text-slate-500">
          💡 Click any clause node to inspect risk analysis details
        </span>
      </div>

      <div ref={graphContainerRef} className="relative">
        {isLoading && !riskGraph ? (
          <LoadingSkeleton lines={8} className="h-[550px] p-6 bg-slate-50 rounded-xl" />
        ) : riskGraph ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className={selectedClause ? 'lg:col-span-3' : 'lg:col-span-4'}>
              <RiskDNAGraphInner
                nodes={riskGraph.nodes}
                edges={riskGraph.edges}
                onNodeClick={(data) => setSelectedClause(data)}
                direction={comparisonDoc ? 'LR' : 'TB'}
              />
            </div>

            {selectedClause && (
              <div className="lg:col-span-1 p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 h-[550px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 truncate" title={selectedClause.title}>
                    {selectedClause.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedClause(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                    aria-label="Close clause inspector"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Risk Assessment:
                  </span>
                  <span
                    style={{
                      backgroundColor: RISK_COLOR_MAP[selectedClause.riskLevel].bg,
                      color: RISK_COLOR_MAP[selectedClause.riskLevel].text,
                      border: `1px solid ${RISK_COLOR_MAP[selectedClause.riskLevel].border}`,
                    }}
                    className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider inline-block"
                  >
                    {selectedClause.riskLevel}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Risk Rationale:
                  </span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedClause.riskReason}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Original Clause Text:
                  </span>
                  <div className="text-xs text-slate-600 p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-serif max-h-48 overflow-y-auto">
                    {selectedClause.fullText || selectedClause.shortText}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {isAccessibilityMode && riskGraph && (
        <GraphAccessibilityTable nodes={riskGraph.nodes} edges={riskGraph.edges} />
      )}
    </div>
  );
}

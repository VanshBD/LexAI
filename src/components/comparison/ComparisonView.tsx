'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useStreamingResponse } from '@/hooks/useStreamingResponse';
import { ComparisonPane } from './ComparisonPane';
import { ComparisonSummaryPanel } from './ComparisonSummaryPanel';
import { ExportButton, ExportFormat } from '@/components/shared/ExportButton';
import { exportToPdf } from '@/lib/export/pdfExporter';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { ComparisonResult, ComparisonHighlight } from '@/types/ai';

export function ComparisonView() {
  const docA = useDocumentStore((state) => state.documents[0]);
  const docB = useDocumentStore((state) => state.documents[1]);
  const comparisonResult = useDocumentStore((state) => state.comparisonResult);
  const setComparisonResult = useDocumentStore((state) => state.setComparisonResult);

  const [isSyncScrollEnabled, setIsSyncScrollEnabled] = useState(false);

  const scrollRefA = useRef<HTMLDivElement>(null);
  const scrollRefB = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  const { streamedData, isStreaming, error, trigger, retry } = useStreamingResponse();

  const handleScroll = (source: 'A' | 'B') => (e: React.UIEvent<HTMLDivElement>) => {
    if (!isSyncScrollEnabled) return;
    if (isSyncingRef.current) return;

    const sourceEl = e.currentTarget;
    const targetEl = source === 'A' ? scrollRefB.current : scrollRefA.current;

    if (!targetEl) return;

    isSyncingRef.current = true;

    const maxSourceScroll = sourceEl.scrollHeight - sourceEl.clientHeight;
    const maxTargetScroll = targetEl.scrollHeight - targetEl.clientHeight;

    if (maxSourceScroll > 0 && maxTargetScroll > 0) {
      const scrollRatio = sourceEl.scrollTop / maxSourceScroll;
      targetEl.scrollTop = Math.round(scrollRatio * maxTargetScroll);
    } else {
      targetEl.scrollTop = sourceEl.scrollTop;
    }

    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  };

  useEffect(() => {
    if (!docA || !docB) return;
    if (comparisonResult) return;

    trigger('/api/compare', {
      documentTextA: docA.text,
      documentTextB: docB.text,
      documentIdA: docA.id,
      documentIdB: docB.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docA?.id, docB?.id]);

  const doneEvent = streamedData.find((e: any) => e.type === 'done');

  useEffect(() => {
    if (doneEvent && docA && docB) {
      const highlightsA: ComparisonHighlight[] = [];
      const highlightsB: ComparisonHighlight[] = [];

      streamedData.forEach((evt: any) => {
        if (evt.type === 'difference' && evt.item) {
          highlightsA.push({
            type: 'difference',
            clauseText: evt.item.clauseA || '',
            matchedClauseText: evt.item.clauseB,
            summary: evt.item.description || 'Clause difference identified',
            documentName: docA.name,
          });
          highlightsB.push({
            type: 'difference',
            clauseText: evt.item.clauseB || '',
            matchedClauseText: evt.item.clauseA,
            summary: evt.item.description || 'Clause difference identified',
            documentName: docB.name,
          });
        } else if (evt.type === 'conflict' && evt.item) {
          highlightsA.push({
            type: 'conflict',
            clauseText: evt.item.clauseA || '',
            matchedClauseText: evt.item.clauseB,
            summary: evt.item.summary || 'Direct legal conflict identified',
            documentName: docA.name,
          });
          highlightsB.push({
            type: 'conflict',
            clauseText: evt.item.clauseB || '',
            matchedClauseText: evt.item.clauseA,
            summary: evt.item.summary || 'Direct legal conflict identified',
            documentName: docB.name,
          });
        } else if (evt.type === 'missing' && evt.item) {
          const isMissingFromA = evt.item.missingFrom === 'A';
          const targetArray = isMissingFromA ? highlightsA : highlightsB;
          targetArray.push({
            type: 'missing',
            clauseText: evt.item.clause || '',
            summary: `Clause absent from ${isMissingFromA ? docA.name : docB.name}`,
            documentName: isMissingFromA ? docA.name : docB.name,
          });
        }
      });

      const res: ComparisonResult = {
        highlights: [highlightsA, highlightsB],
        totalDifferences: doneEvent.totalDifferences ?? highlightsA.filter((h) => h.type === 'difference').length,
        totalConflicts: doneEvent.totalConflicts ?? highlightsA.filter((h) => h.type === 'conflict').length,
        totalMissing: doneEvent.totalMissing ?? highlightsA.filter((h) => h.type === 'missing').length,
      };

      setComparisonResult(res);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(doneEvent)]);

  // Derive activeResult: store state if available, or in-flight aggregation from streamed events
  const activeResult = React.useMemo(() => {
    if (comparisonResult) return comparisonResult;

    if (!docA || !docB) return null;

    const highlightsA: ComparisonHighlight[] = [];
    const highlightsB: ComparisonHighlight[] = [];

    streamedData.forEach((evt: any) => {
      if (evt.type === 'difference' && evt.item) {
        highlightsA.push({
          type: 'difference',
          clauseText: evt.item.clauseA || '',
          matchedClauseText: evt.item.clauseB,
          summary: evt.item.description || 'Clause difference identified',
          documentName: docA.name,
        });
        highlightsB.push({
          type: 'difference',
          clauseText: evt.item.clauseB || '',
          matchedClauseText: evt.item.clauseA,
          summary: evt.item.description || 'Clause difference identified',
          documentName: docB.name,
        });
      } else if (evt.type === 'conflict' && evt.item) {
        highlightsA.push({
          type: 'conflict',
          clauseText: evt.item.clauseA || '',
          matchedClauseText: evt.item.clauseB,
          summary: evt.item.summary || 'Direct legal conflict identified',
          documentName: docA.name,
        });
        highlightsB.push({
          type: 'conflict',
          clauseText: evt.item.clauseB || '',
          matchedClauseText: evt.item.clauseA,
          summary: evt.item.summary || 'Direct legal conflict identified',
          documentName: docB.name,
        });
      } else if (evt.type === 'missing' && evt.item) {
        const isMissingFromA = evt.item.missingFrom === 'A';
        const targetArray = isMissingFromA ? highlightsA : highlightsB;
        targetArray.push({
          type: 'missing',
          clauseText: evt.item.clause || '',
          summary: `Clause absent from ${isMissingFromA ? docA.name : docB.name}`,
          documentName: isMissingFromA ? docA.name : docB.name,
        });
      }
    });

    if (highlightsA.length === 0 && highlightsB.length === 0) return null;

    return {
      highlights: [highlightsA, highlightsB],
      totalDifferences: highlightsA.filter((h) => h.type === 'difference').length,
      totalConflicts: highlightsA.filter((h) => h.type === 'conflict').length,
      totalMissing: highlightsA.filter((h) => h.type === 'missing').length + highlightsB.filter((h) => h.type === 'missing').length,
    } as ComparisonResult;
  }, [comparisonResult, streamedData, docA, docB]);

  const handleExport = async (format: ExportFormat) => {
    if (!activeResult || !docA || !docB) return;

    const lines: string[] = [
      `LEXAI DOCUMENT COMPARISON REPORT`,
      `Document A: ${docA.name}`,
      `Document B: ${docB.name}`,
      '='.repeat(50),
      `Summary: ${activeResult.totalDifferences} Differences | ${activeResult.totalConflicts} Conflicts | ${activeResult.totalMissing} Missing`,
      '',
      `## Document A Highlights:`,
      ...activeResult.highlights[0].map(
        (h) => `[${h.type.toUpperCase()}] ${h.summary}\nClause: ${h.clauseText}\n`
      ),
      `## Document B Highlights:`,
      ...activeResult.highlights[1].map(
        (h) => `[${h.type.toUpperCase()}] ${h.summary}\nClause: ${h.clauseText}\n`
      ),
    ];

    const fullText = lines.join('\n');

    if (format === 'txt') {
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `comparison-${docA.name}-vs-${docB.name}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      await exportToPdf(fullText, `comparison-${docA.name}-vs-${docB.name}.pdf`);
    }
  };

  if (!docA || !docB) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-xl space-y-2">
        <h4 className="font-semibold text-slate-700">Two Documents Required</h4>
        <p className="text-xs">
          Please upload both Document 1 and Document 2 above to compare them side-by-side for conflicts, differences, and missing clauses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            Side-by-Side Document Comparison
          </h3>
          <p className="text-xs text-slate-500">
            Independent scrolling by default • Toggle Synchronized Scroll whenever desired
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Synchronized Scroll Toggle */}
          <button
            type="button"
            onClick={() => setIsSyncScrollEnabled((prev) => !prev)}
            aria-pressed={isSyncScrollEnabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              isSyncScrollEnabled
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>{isSyncScrollEnabled ? 'Sync Scroll: ON' : 'Sync Scroll: OFF'}</span>
          </button>

          {/* Re-analyze Comparison */}
          <button
            type="button"
            onClick={() => {
              if (docA && docB) {
                setComparisonResult(null as any);
                trigger('/api/compare', {
                  documentTextA: docA.text,
                  documentTextB: docB.text,
                  documentIdA: docA.id,
                  documentIdB: docB.id,
                });
              }
            }}
            disabled={isStreaming}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>🔄</span>
            <span>{isStreaming ? 'Analyzing...' : 'Re-Compare Documents'}</span>
          </button>

          <ExportButton
            label="Export Report"
            formats={['pdf', 'txt']}
            onExport={handleExport}
            isDisabled={!activeResult || isStreaming}
          />
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={retry} />}

      {isStreaming && !activeResult && <LoadingSkeleton lines={8} />}

      {activeResult && <ComparisonSummaryPanel comparisonResult={activeResult} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ComparisonPane
          documentName={docA.name}
          text={docA.text}
          highlights={activeResult?.highlights[0] || []}
          scrollRef={scrollRefA}
          onScroll={handleScroll('A')}
        />
        <ComparisonPane
          documentName={docB.name}
          text={docB.text}
          highlights={activeResult?.highlights[1] || []}
          scrollRef={scrollRefB}
          onScroll={handleScroll('B')}
        />
      </div>
    </div>
  );
}

'use client';

import React, { useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useStreamingResponse } from '@/hooks/useStreamingResponse';
import { useSessionCache } from '@/hooks/useSessionCache';
import { SummarySection } from './SummarySection';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { DisclaimerBadge } from '@/components/shared/DisclaimerBadge';
import { ExportButton, ExportFormat } from '@/components/shared/ExportButton';
import { exportToPdf } from '@/lib/export/pdfExporter';
import { SummaryResult } from '@/types/ai';

interface SummaryPanelProps {
  slot?: 0 | 1;
}

export function SummaryPanel({ slot = 0 }: SummaryPanelProps) {
  const document = useDocumentStore((state) => state.documents[slot]);
  const currentSummary = useDocumentStore((state) => state.summaries[slot]);
  const setSummary = useDocumentStore((state) => state.setSummary);

  const cacheKey = document ? `lexai_summary_${document.id}` : '';
  const { get: getCachedSummary, set: setCachedSummary } = useSessionCache<SummaryResult>(cacheKey);

  const { streamedData, isStreaming, error, trigger, retry } = useStreamingResponse();

  useEffect(() => {
    if (!document) return;

    // Check session cache first
    const cached = getCachedSummary();
    if (cached) {
      setSummary(slot, cached);
      return;
    }

    // Otherwise trigger API call
    trigger('/api/summarize', {
      documentText: document.text,
      documentId: document.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id]);

  // Aggregate sections from stream
  const streamedSections = streamedData
    .filter((e: any) => e.type === 'section')
    .map((e: any) => ({ title: e.title, content: e.content }));

  const doneEvent = streamedData.find((e: any) => e.type === 'done');
  const disclaimerEvent = streamedData.find((e: any) => e.type === 'disclaimer');

  useEffect(() => {
    if (doneEvent && document) {
      const summaryResult: SummaryResult = {
        documentId: document.id,
        sections: streamedSections,
        disclaimer:
          disclaimerEvent?.text ||
          'This summary is for informational purposes only and does not constitute legal advice. Always consult a licensed attorney.',
        generatedAt: Date.now(),
      };
      setSummary(slot, summaryResult);
      setCachedSummary(summaryResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(doneEvent)]);

  const activeSections = currentSummary?.sections || streamedSections;
  const activeDisclaimer =
    currentSummary?.disclaimer ||
    disclaimerEvent?.text ||
    'This summary is for informational purposes only and does not constitute legal advice. Always consult a licensed attorney.';

  const handleExport = async (format: ExportFormat) => {
    const textContent = [
      `LEXAI DOCUMENT SUMMARY - ${document?.name || 'Document'}`,
      '='.repeat(50),
      '',
      ...activeSections.map((s) => `### ${s.title}\n${s.content}\n`),
      '',
      `LEGAL DISCLAIMER:\n${activeDisclaimer}`,
    ].join('\n');

    if (format === 'txt') {
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `summary-${document?.name || 'doc'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      await exportToPdf(textContent, `summary-${document?.name || 'doc'}.pdf`);
    }
  };

  if (!document) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
        Upload a document to view its plain-language summary.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            Plain Language Summary
          </h3>
          <p className="text-xs text-slate-500">
            Flesch-Kincaid Grade ≤ 8 • Simplified clause explanations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton
            label="Export Summary"
            formats={['pdf', 'txt']}
            onExport={handleExport}
            isDisabled={activeSections.length === 0 || isStreaming}
          />
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={retry} />}

      {isStreaming && activeSections.length === 0 && (
        <LoadingSkeleton lines={6} />
      )}

      <div className="space-y-4">
        {activeSections.map((sec, idx) => (
          <SummarySection
            key={`${sec.title}-${idx}`}
            title={sec.title}
            content={sec.content}
            isStreaming={isStreaming && idx === activeSections.length - 1}
          />
        ))}
      </div>

      {activeSections.length > 0 && (
        <div className="pt-2">
          <DisclaimerBadge text={activeDisclaimer} />
        </div>
      )}
    </div>
  );
}

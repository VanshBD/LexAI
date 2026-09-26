'use client';

import React, { useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useStreamingResponse } from '@/hooks/useStreamingResponse';
import { NextStep } from '@/types/ai';
import { ExportButton, ExportFormat } from '@/components/shared/ExportButton';
import { exportToPdf } from '@/lib/export/pdfExporter';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { DisclaimerBadge } from '@/components/shared/DisclaimerBadge';

export function NextStepsPanel() {
  const document = useDocumentStore((state) => state.documents[0]);
  const summary = useDocumentStore((state) => state.summaries[0]);
  const nextSteps = useDocumentStore((state) => state.nextSteps);
  const setNextSteps = useDocumentStore((state) => state.setNextSteps);

  const { streamedData, isStreaming, error, trigger, retry } = useStreamingResponse();

  useEffect(() => {
    if (!document) return;
    if (nextSteps && nextSteps.length > 0) return;

    const summaryText = summary?.sections.map((s) => `${s.title}: ${s.content}`).join('\n') || '';

    trigger('/api/next-steps', {
      documentText: document.text,
      documentId: document.id,
      summaryText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id]);

  const doneEvent = streamedData.find((e: any) => e.type === 'done');
  const disclaimerEvent = streamedData.find((e: any) => e.type === 'disclaimer');

  useEffect(() => {
    if (doneEvent) {
      const steps: NextStep[] = streamedData
        .filter((e: any) => e.type === 'step' && e.step)
        .map((e: any) => e.step);

      if (steps.length > 0) {
        setNextSteps(steps);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(doneEvent)]);

  const activeSteps =
    nextSteps ||
    streamedData.filter((e: any) => e.type === 'step' && e.step).map((e: any) => e.step);

  const handleExport = async (format: ExportFormat) => {
    if (!activeSteps || activeSteps.length === 0) return;

    const lines: string[] = [
      `LEXAI RECOMMENDED NEXT STEPS - ${document?.name || 'Document'}`,
      '='.repeat(50),
      '',
    ];

    activeSteps.forEach((s, idx) => {
      lines.push(`${idx + 1}. [${s.category}] ${s.text}`);
      if (s.deadline) lines.push(`   Deadline: ${s.deadline}`);
    });

    lines.push('');
    lines.push(`DISCLAIMER:\n${disclaimerEvent?.text || 'Informational only — Not legal advice.'}`);

    const fullText = lines.join('\n');

    if (format === 'txt') {
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `next-steps-${document?.name || 'doc'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      await exportToPdf(fullText, `next-steps-${document?.name || 'doc'}.pdf`);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Do Now':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Do Soon':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (!document) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
        Upload a document to generate actionable next steps and recommendations.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            Recommended Action Plan & Next Steps
          </h3>
          <p className="text-xs text-slate-500">
            Prioritized by urgency • Highlighted deadlines and legal risk mitigation
          </p>
        </div>

        <ExportButton
          label="Export Next Steps"
          formats={['pdf', 'txt']}
          onExport={handleExport}
          isDisabled={activeSteps.length === 0 || isStreaming}
        />
      </div>

      {error && <ErrorBanner message={error} onRetry={retry} />}

      {isStreaming && activeSteps.length === 0 && <LoadingSkeleton lines={6} />}

      {!isStreaming && activeSteps.length === 0 && (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-3">
          <p className="text-xs text-slate-500">
            Click below to generate prioritized next steps and action recommendations for this document.
          </p>
          <button
            type="button"
            onClick={() => {
              const summaryText = summary?.sections.map((s) => `${s.title}: ${s.content}`).join('\n') || '';
              trigger('/api/next-steps', {
                documentText: document.text,
                documentId: document.id,
                summaryText,
              });
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Generate Next Steps
          </button>
        </div>
      )}

      <div className="space-y-3">
        {activeSteps.map((step, idx) => (
          <div
            key={step.id || idx}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold mt-0.5">
                {idx + 1}
              </span>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  {step.text}
                </p>
                {step.deadline && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-red-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Explicit Deadline: {step.deadline}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getCategoryBadgeClass(
                  step.category
                )}`}
              >
                {step.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      {activeSteps.length > 0 && (
        <div className="pt-2">
          <DisclaimerBadge
            text={
              disclaimerEvent?.text ||
              'These suggestions are informational only and do not constitute legal advice.'
            }
          />
        </div>
      )}
    </div>
  );
}

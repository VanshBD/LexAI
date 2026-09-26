'use client';

import React, { useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useStreamingResponse } from '@/hooks/useStreamingResponse';
import { AttorneyHeading, AttorneyPackData } from '@/types/ai';
import { ExportButton, ExportFormat } from '@/components/shared/ExportButton';
import { exportToPdf } from '@/lib/export/pdfExporter';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { DisclaimerBadge } from '@/components/shared/DisclaimerBadge';

export function AttorneyPackPanel() {
  const document = useDocumentStore((state) => state.documents[0]);
  const summary = useDocumentStore((state) => state.summaries[0]);
  const riskGraph = useDocumentStore((state) => state.riskGraphs[0]);
  const attorneyPack = useDocumentStore((state) => state.attorneyPack);
  const setAttorneyPack = useDocumentStore((state) => state.setAttorneyPack);

  const [hasRequested, setHasRequested] = useState(false);
  const { streamedData, isStreaming, error, trigger, retry } = useStreamingResponse();

  const handleGenerate = async () => {
    if (!document) return;
    setHasRequested(true);

    const summaryText = summary?.sections.map((s) => `${s.title}: ${s.content}`).join('\n') || '';

    await trigger('/api/attorney-pack', {
      documentText: document.text,
      documentId: document.id,
      summaryText,
      riskGraphData: riskGraph ? { nodes: riskGraph.nodes } : undefined,
    });
  };

  const doneEvent = streamedData.find((e: any) => e.type === 'done');
  const disclaimerEvent = streamedData.find((e: any) => e.type === 'disclaimer');

  React.useEffect(() => {
    if (doneEvent && document) {
      const headings: AttorneyHeading[] = [];
      const questionsMap: Record<string, string[]> = {
        'understanding-rights': [],
        'clarifying-obligations': [],
        'identifying-risks': [],
        'before-signing': [],
      };

      streamedData.forEach((evt: any) => {
        if (evt.type === 'heading' && evt.heading) {
          if (!headings.some((h) => h.key === evt.heading.key)) {
            headings.push(evt.heading);
          }
        }
        if (evt.type === 'question' && evt.headingKey && evt.question) {
          if (!questionsMap[evt.headingKey]) {
            questionsMap[evt.headingKey] = [];
          }
          questionsMap[evt.headingKey].push(evt.question);
        }
      });

      const totalQuestions = Object.values(questionsMap).reduce((acc, curr) => acc + curr.length, 0);

      const packData: AttorneyPackData = {
        documentId: document.id,
        headings: headings.length > 0 ? headings : [
          { key: 'understanding-rights', label: 'Understanding Your Rights' },
          { key: 'clarifying-obligations', label: 'Clarifying Your Obligations' },
          { key: 'identifying-risks', label: 'Identifying Risks' },
          { key: 'before-signing', label: 'Before You Sign' },
        ],
        questionsByHeading: questionsMap,
        disclaimer:
          disclaimerEvent?.text ||
          'These questions are starting points. Your attorney may identify additional relevant issues.',
        totalQuestions,
      };

      setAttorneyPack(packData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(doneEvent)]);

  const activePack = attorneyPack;

  const handleExport = async (format: ExportFormat) => {
    if (!activePack) return;

    const lines: string[] = [
      `ATTORNEY PREPARATION PACK - ${document?.name || 'Document'}`,
      '='.repeat(50),
      'Questions curated by LexAI to ask your legal counsel during consultation.',
      '',
    ];

    activePack.headings.forEach((h) => {
      lines.push(`## ${h.label}`);
      const questions = activePack.questionsByHeading[h.key] || [];
      if (questions.length === 0) {
        lines.push('  (None generated)');
      } else {
        questions.forEach((q, idx) => {
          lines.push(`  ${idx + 1}. ${q}`);
        });
      }
      lines.push('');
    });

    lines.push(`DISCLAIMER:\n${activePack.disclaimer}`);

    const fullText = lines.join('\n');

    if (format === 'txt') {
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `attorney-prep-${document?.name || 'doc'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      await exportToPdf(fullText, `attorney-prep-${document?.name || 'doc'}.pdf`);
    }
  };

  if (!document) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
        Upload a document to prepare high-impact questions for your attorney consultation.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            Attorney Preparation Consultation Pack
          </h3>
          <p className="text-xs text-slate-500">
            8–15 targeted questions based on this document&apos;s specific risk profile
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activePack && (
            <ExportButton
              label="Export Prep Pack"
              formats={['pdf', 'txt']}
              onExport={handleExport}
              isDisabled={isStreaming}
            />
          )}
        </div>
      </div>

      {!activePack && !hasRequested && (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl font-bold">
            💼
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Generate Your Consultation Questions
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            LexAI will scan &ldquo;{document.name}&rdquo; and compile strategic questions tailored to the high-risk clauses, unusual obligations, and rights in this document.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            Prepare for My Attorney
          </button>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={retry} />}

      {isStreaming && !activePack && <LoadingSkeleton lines={8} />}

      {activePack && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePack.headings.map((heading) => {
              const questions = activePack.questionsByHeading[heading.key] || [];

              return (
                <div key={heading.key} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide border-b border-slate-100 pb-2">
                    {heading.label}
                  </h4>

                  <ul className="space-y-2">
                    {questions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <DisclaimerBadge text={activePack.disclaimer} />
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useStreamingResponse } from '@/hooks/useStreamingResponse';
import { ChecklistItem } from './ChecklistItem';
import { ChecklistHeading, ChecklistData, ChecklistEntry } from '@/types/checklist';
import { ExportButton, ExportFormat } from '@/components/shared/ExportButton';
import { exportToPdf } from '@/lib/export/pdfExporter';
import { copyToClipboard } from '@/lib/export/clipboardExporter';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

const HEADINGS: ChecklistHeading[] = [
  'Your Obligations',
  'Your Rights',
  'Important Deadlines',
  'Actions Required Before Signing',
];

export function ChecklistPanel() {
  const [selectedSlot, setSelectedSlot] = useState<0 | 1>(0);
  const docA = useDocumentStore((state) => state.documents[0]);
  const docB = useDocumentStore((state) => state.documents[1]);

  const document = selectedSlot === 0 ? docA : docB;
  const checklist = useDocumentStore((state) => state.checklist[selectedSlot]);
  const setChecklist = useDocumentStore((state) => state.setChecklist);
  const toggleChecklistItem = useDocumentStore((state) => state.toggleChecklistItem);

  const { streamedData, isStreaming, error, trigger, retry } = useStreamingResponse();

  useEffect(() => {
    if (!document) return;

    if (checklist) return; // Already exists in store

    trigger('/api/checklist', {
      documentText: document.text,
      documentId: document.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id]);

  const doneEvent = streamedData.find((e: any) => e.type === 'done');

  useEffect(() => {
    if (doneEvent && document) {
      const itemsMap: Record<ChecklistHeading, ChecklistEntry[]> = {
        'Your Obligations': [],
        'Your Rights': [],
        'Important Deadlines': [],
        'Actions Required Before Signing': [],
      };

      streamedData.forEach((evt: any) => {
        if (evt.type === 'item' && evt.headingKey && evt.item) {
          const heading = evt.headingKey as ChecklistHeading;
          if (itemsMap[heading]) {
            itemsMap[heading].push({
              id: evt.item.id,
              text: evt.item.text,
              clauseRef: evt.item.clauseRef,
              checked: false,
            });
          }
        }
      });

      const fullData: ChecklistData = {
        documentId: document.id,
        items: itemsMap,
        generatedAt: Date.now(),
      };

      setChecklist(selectedSlot, fullData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(doneEvent), selectedSlot]);

  // Derive active items: use store's checklist if available, otherwise aggregate from streamedData in real-time
  const activeItems = React.useMemo(() => {
    if (checklist?.items) return checklist.items;

    const itemsMap: Record<ChecklistHeading, ChecklistEntry[]> = {
      'Your Obligations': [],
      'Your Rights': [],
      'Important Deadlines': [],
      'Actions Required Before Signing': [],
    };

    let hasAny = false;
    streamedData.forEach((evt: any) => {
      if (evt.type === 'item' && evt.headingKey && evt.item) {
        const heading = evt.headingKey as ChecklistHeading;
        if (itemsMap[heading]) {
          hasAny = true;
          itemsMap[heading].push({
            id: evt.item.id,
            text: evt.item.text,
            clauseRef: evt.item.clauseRef,
            checked: false,
          });
        }
      }
    });

    return hasAny ? itemsMap : null;
  }, [checklist, streamedData]);

  const handleExport = async (format: ExportFormat) => {
    if (!activeItems) return;

    const sections: string[] = [
      `LEXAI ACTION CHECKLIST - ${document?.name || 'Document'}`,
      '='.repeat(50),
      '',
    ];

    HEADINGS.forEach((heading) => {
      sections.push(`## ${heading}`);
      const entries = activeItems[heading] || [];
      if (entries.length === 0) {
        sections.push('  (No items identified)');
      } else {
        entries.forEach((e) => {
          sections.push(`  [${e.checked ? 'X' : ' '}] ${e.text} ${e.clauseRef ? `(${e.clauseRef})` : ''}`);
        });
      }
      sections.push('');
    });

    const fullText = sections.join('\n');

    if (format === 'txt') {
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `checklist-${document?.name || 'doc'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      await exportToPdf(fullText, `checklist-${document?.name || 'doc'}.pdf`);
    }
  };

  const handleCopyClipboard = async () => {
    if (!activeItems) return;
    const lines: string[] = [`LEXAI CHECKLIST: ${document?.name || 'Document'}\n`];
    HEADINGS.forEach((h) => {
      lines.push(`${h}:`);
      (activeItems[h] || []).forEach((item) => {
        lines.push(`- [${item.checked ? '✓' : ' '}] ${item.text}`);
      });
      lines.push('');
    });
    await copyToClipboard(lines.join('\n'));
    alert('Checklist copied to clipboard!');
  };

  if (!document) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
        Upload a document to generate an interactive obligations and rights checklist.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            Interactive Legal Review Checklist
          </h3>
          <p className="text-xs text-slate-500">
            Track key obligations, rights, deadlines, and actions before signing
          </p>

          {docA && docB && (
            <div className="flex items-center gap-1.5 pt-2">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Checklist for:</span>
              <button
                type="button"
                onClick={() => setSelectedSlot(0)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                  selectedSlot === 0
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Primary: {docA.name}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSlot(1)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                  selectedSlot === 1
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Comparison: {docB.name}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyClipboard}
            disabled={!activeItems || isStreaming}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            📋 Copy to Clipboard
          </button>
          <ExportButton
            label="Export Checklist"
            formats={['pdf', 'txt']}
            onExport={handleExport}
            isDisabled={!activeItems || isStreaming}
          />
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={retry} />}

      {isStreaming && !activeItems && <LoadingSkeleton lines={8} />}

      {!isStreaming && !activeItems && (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
            ✅
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Generate Action Checklist
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Extract all obligations, rights, important deadlines, and pre-signing actions into an interactive review checklist.
          </p>
          <button
            type="button"
            onClick={() => {
              if (document) {
                trigger('/api/checklist', {
                  documentText: document.text,
                  documentId: document.id,
                });
              }
            }}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            Generate Checklist
          </button>
        </div>
      )}

      {activeItems && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {HEADINGS.map((heading) => {
            const entries = activeItems[heading] || [];
            return (
              <div key={heading} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {heading}
                  </h4>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    {entries.filter((e) => e.checked).length} / {entries.length} done
                  </span>
                </div>

                <div className="space-y-2">
                  {entries.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No explicit items found for this category.
                    </p>
                  ) : (
                    entries.map((entry) => (
                      <ChecklistItem
                        key={entry.id}
                        entry={entry}
                        onToggle={(id) => toggleChecklistItem(selectedSlot, id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

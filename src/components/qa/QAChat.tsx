'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useStreamingResponse } from '@/hooks/useStreamingResponse';
import { retrieveTopChunks } from '@/lib/ai/ragRetriever';
import { checkForInjection } from '@/lib/security/injectionGuard';
import { QAMessage } from './QAMessage';
import { QAMessage as QAMessageType } from '@/types/ai';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

export function QAChat() {
  const document = useDocumentStore((state) => state.documents[0]);
  const chunks = useDocumentStore((state) => state.chunks[0]);
  const qaHistory = useDocumentStore((state) => state.qaHistory);
  const addQAMessage = useDocumentStore((state) => state.addQAMessage);

  const [inputQuestion, setInputQuestion] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { streamedData, isStreaming, error, trigger } = useStreamingResponse();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [qaHistory.length, streamedData.length]);

  // Aggregate current streaming response tokens
  const streamedContent = streamedData
    .filter((e: any) => e.type === 'token')
    .map((e: any) => e.content)
    .join('');

  const confidenceEvent = streamedData.find((e: any) => e.type === 'confidence');
  const doneEvent = streamedData.find((e: any) => e.type === 'done');

  useEffect(() => {
    if (doneEvent && streamedContent) {
      const assistantMessage: QAMessageType = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
        role: 'assistant',
        content: streamedContent,
        confidenceScore: confidenceEvent?.score,
        citation: confidenceEvent?.citation,
        isLowConfidence: confidenceEvent?.isLowConfidence,
        timestamp: Date.now(),
      };
      addQAMessage(assistantMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(doneEvent)]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isStreaming || !document) return;

    setClientError(null);

    // Client-side prompt injection check
    const injectionCheck = checkForInjection(inputQuestion);
    if (!injectionCheck.isSafe) {
      setClientError('Invalid input detected. Please ask standard questions about the document.');
      return;
    }

    const userMessage: QAMessageType = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`,
      role: 'user',
      content: inputQuestion.trim(),
      timestamp: Date.now(),
    };

    addQAMessage(userMessage);
    const questionText = inputQuestion.trim();
    setInputQuestion('');

    // Retrieve relevant chunks via BM25
    const topChunks = retrieveTopChunks(questionText, chunks, 5);

    // Convert qaHistory to QAHistoryItem format
    const conversationHistory = qaHistory.map((h) => ({
      role: h.role,
      content: h.content,
    }));

    await trigger('/api/qa', {
      question: questionText,
      chunks: topChunks,
      conversationHistory,
      documentId: document.id,
    });
  };

  if (!document) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
        Upload a document to ask questions and search its contents with AI.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 bg-white border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-800">
          Document Intelligence Q&A
        </h3>
        <p className="text-xs text-slate-500">
          Answers grounded strictly in &ldquo;{document.name}&rdquo; with confidence ratings
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {qaHistory.length === 0 && !isStreaming && (
          <div className="text-center text-xs text-slate-400 py-16 space-y-2">
            <p>Ask anything about this document:</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
              {[
                'What are my termination rights?',
                'Are there any non-compete clauses?',
                'What is the governing jurisdiction?',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setInputQuestion(sample)}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 rounded-full text-[11px] text-slate-600 transition-colors"
                >
                  &ldquo;{sample}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {qaHistory.map((msg) => (
          <QAMessage key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <QAMessage
            message={{
              id: 'current-streaming',
              role: 'assistant',
              content: streamedContent,
              timestamp: Date.now(),
            }}
            isStreaming={true}
          />
        )}

        {clientError && <ErrorBanner message={clientError} />}
        {error && <ErrorBanner message={error} />}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask a question about this agreement..."
          aria-label="Ask a question about this agreement"
          disabled={isStreaming}
          className="flex-1 px-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
        />
        <button
          type="submit"
          aria-label={isStreaming ? 'Sending question...' : 'Send question to AI'}
          disabled={!inputQuestion.trim() || isStreaming}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
        >
          {isStreaming ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

'use client';

import React, { useEffect, useRef } from 'react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
}

export function DisclaimerModal({ isOpen, onAcknowledge }: DisclaimerModalProps) {
  const acknowledgeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      acknowledgeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200">
        <div className="flex items-center gap-3 text-indigo-600 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 id="disclaimer-title" className="text-xl font-bold text-slate-900">
            Important Legal & Privacy Notice
          </h2>
        </div>

        <div className="space-y-3 text-sm text-slate-600 mb-6">
          <p className="font-semibold text-slate-800">
            LexAI is an artificial intelligence assistant providing legal document information and analysis only.
          </p>
          <p>
            It does <strong className="text-slate-900">NOT</strong> constitute legal advice, nor does it create an attorney-client relationship. Always consult a licensed attorney for specific legal advice or binding contracts.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded text-blue-900 text-xs">
            <strong className="block mb-1">Privacy Guarantee:</strong>
            Your documents are processed in this browser session only. They are never stored on our servers or databases. Only extracted text (not your files) is securely sent to Google Gemini for real-time analysis.
          </div>
        </div>

        <div className="flex justify-end">
          <button
            ref={acknowledgeButtonRef}
            onClick={onAcknowledge}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}

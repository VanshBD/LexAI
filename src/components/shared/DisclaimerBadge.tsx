import React from 'react';

interface DisclaimerBadgeProps {
  text?: string;
  className?: string;
}

export function DisclaimerBadge({
  text = 'Informational only — Not legal advice. Consult a licensed attorney.',
  className = '',
}: DisclaimerBadgeProps) {
  return (
    <div
      role="note"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs font-medium ${className}`}
    >
      <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{text}</span>
    </div>
  );
}

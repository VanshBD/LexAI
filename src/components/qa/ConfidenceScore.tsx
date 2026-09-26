import React from 'react';

interface ConfidenceScoreProps {
  score: number;
  citation?: string | null;
}

export function ConfidenceScore({ score, citation }: ConfidenceScoreProps) {
  const isLowConfidence = score < 60;

  return (
    <div className="mt-2 space-y-1.5 text-xs">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
            isLowConfidence
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          <span>Confidence: {score}%</span>
        </span>

        {citation && (
          <span className="text-slate-500 font-medium truncate" title={citation}>
            Source: <span className="text-slate-700 italic">{citation}</span>
          </span>
        )}
      </div>

      {isLowConfidence && (
        <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
          ⚠️ Low confidence answer: This question may refer to concepts outside this specific document. Please verify directly with an attorney.
        </p>
      )}
    </div>
  );
}

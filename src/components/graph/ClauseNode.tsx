'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { ClauseNodeData } from '@/types/graph';
import { RISK_COLOR_MAP } from '@/lib/utils/colorUtils';

interface ClauseNodeProps {
  data: ClauseNodeData;
}

export function ClauseNode({ data }: ClauseNodeProps) {
  const colors = RISK_COLOR_MAP[data.riskLevel] || RISK_COLOR_MAP.moderate;

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`${data.title}, Risk Level: ${data.riskLevel}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
      className="p-3 rounded-lg border-2 shadow-md w-52 text-left cursor-pointer transition-transform hover:scale-105 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />

      <div className="flex items-center justify-between gap-1 mb-1">
        <h5 className="font-bold text-xs truncate" title={data.title}>
          {data.title}
        </h5>
        <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider bg-white/60">
          {data.riskLevel}
        </span>
      </div>

      <p className="text-[11px] line-clamp-2 opacity-90 leading-tight">
        {data.shortText}
      </p>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
}

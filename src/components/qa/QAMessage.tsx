'use client';

import React from 'react';
import { QAMessage as QAMessageType } from '@/types/ai';
import { StreamingText } from '@/components/shared/StreamingText';
import { ConfidenceScore } from './ConfidenceScore';

interface QAMessageProps {
  message: QAMessageType;
  isStreaming?: boolean;
}

export function QAMessage({ message, isStreaming = false }: QAMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex flex-col ${
        isUser ? 'items-end' : 'items-start'
      } space-y-1 my-3`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
        }`}
      >
        <StreamingText
          content={message.content}
          isStreaming={isStreaming && !isUser}
          className={isUser ? 'text-white' : 'text-slate-800'}
        />

        {!isUser && !isStreaming && typeof message.confidenceScore === 'number' && (
          <ConfidenceScore
            score={message.confidenceScore}
            citation={message.citation}
          />
        )}
      </div>

      <span className="text-[10px] text-slate-400 px-1">
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
}

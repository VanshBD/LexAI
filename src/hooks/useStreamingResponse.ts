'use client';

import { useState, useCallback, useRef } from 'react';
import { deduplicateRequest } from '@/lib/utils/requestDeduplicator';

export function useStreamingResponse<T = any>() {
  const [streamedData, setStreamedData] = useState<T[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastCallRef = useRef<{ url: string; body: any } | null>(null);

  const trigger = useCallback(
    async (url: string, body: any, onEvent?: (event: any) => void) => {
      // Abort any ongoing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      lastCallRef.current = { url, body };

      setIsStreaming(true);
      setError(null);
      setStreamedData([]);

      const dedupKey = `${url}_${JSON.stringify(body)}`;

      // Execute request with backoff retry (up to 3 attempts for 5xx errors)
      const executeWithRetry = async (attempt = 1): Promise<Response> => {
        try {
          const res = await deduplicateRequest(dedupKey, () =>
            fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
              signal: abortControllerRef.current?.signal,
            })
          );

          if (!res.ok) {
            if (res.status >= 500 && attempt < 3) {
              const backoff = Math.pow(2, attempt - 1) * 500;
              await new Promise((resolve) => setTimeout(resolve, backoff));
              return executeWithRetry(attempt + 1);
            }
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Request failed with status ${res.status}`);
          }

          return res;
        } catch (err: any) {
          if (attempt < 3 && err.name !== 'AbortError') {
            const backoff = Math.pow(2, attempt - 1) * 500;
            await new Promise((resolve) => setTimeout(resolve, backoff));
            return executeWithRetry(attempt + 1);
          }
          throw err;
        }
      };

      try {
        const response = await executeWithRetry();
        if (!response.body) {
          throw new Error('Readable stream not supported in response');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const jsonStr = trimmed.slice(5).trim();
              if (jsonStr) {
                try {
                  const event = JSON.parse(jsonStr);
                  if (event.type === 'error') {
                    throw new Error(event.message || 'Stream processing error');
                  }
                  setStreamedData((prev) => [...prev, event as T]);
                  if (onEvent) onEvent(event);
                } catch (e: any) {
                  if (e.message !== 'Unexpected end of JSON input') {
                    console.error('Error parsing SSE event:', e);
                  }
                }
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'An error occurred while streaming data');
        }
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  const retry = useCallback(() => {
    if (lastCallRef.current) {
      trigger(lastCallRef.current.url, lastCallRef.current.body);
    }
  }, [trigger]);

  return {
    streamedData,
    isStreaming,
    error,
    trigger,
    retry,
    setStreamedData,
  };
}

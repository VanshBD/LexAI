import { approximateTokens } from '@/lib/utils/tokenCounter';

export interface TextChunk {
  chunkId: string;
  startOffset: number;
  endOffset: number;
  tokenCount: number;
  text: string;
}

/**
 * Splits document text into manageable chunks for RAG.
 * Splits on sentence boundaries: /(?<=[.!?])\s+(?=[A-Z])/g
 * Accumulates sentences up to target tokens (default 1800-2000),
 * maintains overlap with last 2 sentences, and tags each with a UUID.
 *
 * @param text - The full document plain text.
 * @param maxTokens - Maximum token threshold per chunk (default: 2000).
 * @returns Array of TextChunk objects.
 */
export function chunkDocument(text: string, maxTokens = 2000): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const rawText = text.trim();
  const sentences = rawText.split(/(?<=[.!?])\s+(?=[A-Z])/g);

  // If text doesn't split nicely or is a single short sentence
  if (sentences.length <= 1) {
    return [
      {
        chunkId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `chunk-1`,
        startOffset: 0,
        endOffset: rawText.length,
        tokenCount: approximateTokens(rawText),
        text: rawText,
      },
    ];
  }

  const chunks: TextChunk[] = [];
  const targetThreshold = Math.min(1800, maxTokens);
  let currentSentences: string[] = [];
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    currentSentences.push(sentences[i]);
    const currentCombined = currentSentences.join(' ');
    const currentTokens = approximateTokens(currentCombined);

    if (currentTokens >= targetThreshold || i === sentences.length - 1) {
      const chunkText = currentCombined;
      const startOffset = rawText.indexOf(chunkText);
      const endOffset = startOffset >= 0 ? startOffset + chunkText.length : rawText.length;

      chunks.push({
        chunkId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `chunk-${++chunkIndex}`,
        startOffset: Math.max(0, startOffset),
        endOffset,
        tokenCount: approximateTokens(chunkText),
        text: chunkText,
      });

      // Maintain overlap with last 2 sentences if not at the end
      if (i < sentences.length - 1) {
        currentSentences = currentSentences.slice(-2);
      } else {
        currentSentences = [];
      }
    }
  }

  return chunks;
}

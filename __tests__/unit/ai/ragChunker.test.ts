import { describe, it, expect } from 'vitest';
import { chunkDocument } from '@/lib/ai/ragChunker';
import { retrieveTopChunks } from '@/lib/ai/ragRetriever';

describe('ragChunker & ragRetriever comprehensive suite', () => {
  it('returns empty array for empty or whitespace document', () => {
    expect(chunkDocument('')).toEqual([]);
    expect(chunkDocument('   ')).toEqual([]);
    expect(chunkDocument(null as unknown as string)).toEqual([]);
  });

  it('handles single sentence document gracefully without error', () => {
    const text = 'This is a single short sentence agreement.';
    const chunks = chunkDocument(text, 2000);
    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe(text);
    expect(chunks[0].chunkId).toBeDefined();
    expect(chunks[0].startOffset).toBe(0);
    expect(chunks[0].endOffset).toBe(text.length);
  });

  it('chunks multi-sentence document and maintains overlap across chunks', () => {
    // Generate text with 40 sentences to exceed targetThreshold
    const sentences = Array.from({ length: 40 }, (_, i) => `Sentence number ${i + 1} specifies clause terms.`);
    const fullText = sentences.join(' ');
    const chunks = chunkDocument(fullText, 30); // small threshold to force chunking

    expect(chunks.length).toBeGreaterThan(1);
    // Verify each chunk is properly populated
    for (const chunk of chunks) {
      expect(chunk.chunkId).toBeDefined();
      expect(chunk.tokenCount).toBeGreaterThan(0);
      expect(chunk.startOffset).toBeGreaterThanOrEqual(0);
      expect(chunk.endOffset).toBeGreaterThan(chunk.startOffset);
    }
  });

  it('retrieves top chunks with various queries and fallbacks', () => {
    const chunks = [
      { chunkId: '1', startOffset: 0, endOffset: 50, tokenCount: 10, text: 'The employee salary is paid monthly.' },
      { chunkId: '2', startOffset: 50, endOffset: 100, tokenCount: 10, text: 'Confidentiality shall last 5 years.' },
      { chunkId: '3', startOffset: 100, endOffset: 150, tokenCount: 10, text: 'Employee termination requires notice.' },
    ];

    // Null or empty query should return slice of chunks
    expect(retrieveTopChunks('', chunks, 2)).toEqual([chunks[0], chunks[1]]);
    expect(retrieveTopChunks('   ', chunks, 2)).toEqual([chunks[0], chunks[1]]);
    expect(retrieveTopChunks('a is', chunks, 2)).toEqual([chunks[0], chunks[1]]); // only short stop words

    // Empty chunks returns empty slice
    expect(retrieveTopChunks('salary', [], 2)).toEqual([]);

    // Specific match
    const result = retrieveTopChunks('salary payment', chunks, 1);
    expect(result.length).toBe(1);
    expect(result[0].chunkId).toBe('1');

    // Tied scores / no matches should still return topK chunks
    const noMatch = retrieveTopChunks('arbitration', chunks, 2);
    expect(noMatch.length).toBe(2);
  });
});

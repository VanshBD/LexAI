import { test, expect } from 'vitest';
import fc from 'fast-check';
import { chunkDocument } from '@/lib/ai/ragChunker';

test('Property 3: Every generated chunk has valid token counts and offsets', () => {
  fc.assert(
    fc.property(
      fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
      (sentences) => {
        const text = sentences.join('. ') + '.';
        const chunks = chunkDocument(text, 2000);
        expect(Array.isArray(chunks)).toBe(true);
        chunks.forEach((chunk) => {
          expect(chunk.chunkId).toBeDefined();
          expect(chunk.tokenCount).toBeGreaterThanOrEqual(0);
          expect(chunk.startOffset).toBeLessThanOrEqual(chunk.endOffset);
        });
      }
    )
  );
});

import { test, expect } from 'vitest';
import fc from 'fast-check';
import { buildQAPrompt } from '@/lib/ai/prompts/qaPrompt';

test('Property 10: QA prompt always embeds chunk context and user question', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 5, maxLength: 100 }),
      fc.string({ minLength: 10, maxLength: 100 }),
      (question, chunkText) => {
        const prompt = buildQAPrompt(question, [{ text: chunkText, chunkId: 'c1' }], []);
        expect(prompt).toContain(question);
        expect(prompt).toContain(chunkText);
        expect(prompt).toContain('CONFIDENCE:');
        expect(prompt).toContain('CITATION:');
      }
    )
  );
});

import { test, expect } from 'vitest';
import fc from 'fast-check';
import { buildAttorneyPackPrompt } from '@/lib/ai/prompts/attorneyPackPrompt';

test('Property 19: Attorney pack prompt requests 8-15 document-specific questions', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 20, maxLength: 200 }),
      fc.string({ minLength: 20, maxLength: 200 }),
      (docText, sumText) => {
        const prompt = buildAttorneyPackPrompt(docText, sumText);
        expect(prompt).toContain('8-15');
        expect(prompt).toContain('understanding-rights');
        expect(prompt).toContain('clarifying-obligations');
        expect(prompt).toContain('identifying-risks');
        expect(prompt).toContain('before-signing');
      }
    )
  );
});

import { test, expect } from 'vitest';
import fc from 'fast-check';
import { buildSummaryPrompt } from '@/lib/ai/prompts/summaryPrompt';

test('Property 4 & 20: AI prompt builders always include legal disclaimers', () => {
  fc.assert(
    fc.property(fc.string({ minLength: 10, maxLength: 500 }), (docText) => {
      const prompt = buildSummaryPrompt(docText);
      expect(prompt).toContain('disclaimer');
      expect(prompt).toContain('does not constitute legal advice');
    })
  );
});

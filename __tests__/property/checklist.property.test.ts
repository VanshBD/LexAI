import { test, expect } from 'vitest';
import fc from 'fast-check';
import { buildChecklistPrompt } from '@/lib/ai/prompts/checklistPrompt';

test('Property 17: Checklist prompt requires all 4 standard headings', () => {
  fc.assert(
    fc.property(fc.string({ minLength: 20, maxLength: 200 }), (docText) => {
      const prompt = buildChecklistPrompt(docText);
      expect(prompt).toContain('Your Obligations');
      expect(prompt).toContain('Your Rights');
      expect(prompt).toContain('Important Deadlines');
      expect(prompt).toContain('Actions Required Before Signing');
    })
  );
});

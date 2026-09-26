import { test, expect } from 'vitest';
import fc from 'fast-check';
import { buildNextStepsPrompt } from '@/lib/ai/prompts/nextStepsPrompt';

test('Property 14, 15, & 16: Next steps prompt enforces 3-7 steps, categories, and attorney referral', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 20, maxLength: 200 }),
      fc.string({ minLength: 20, maxLength: 200 }),
      (docText, sumText) => {
        const prompt = buildNextStepsPrompt(docText, sumText);
        expect(prompt).toContain('3-7');
        expect(prompt).toContain('Do Now');
        expect(prompt).toContain('Do Soon');
        expect(prompt).toContain('Optional');
        expect(prompt).toContain('licensed attorney');
      }
    )
  );
});

import { test, expect } from 'vitest';
import fc from 'fast-check';
import { checkForInjection } from '@/lib/security/injectionGuard';
import { redactPii } from '@/lib/security/piiRedactor';

test('Property 12: Injection detection catches known prompt override vectors', () => {
  const injectionKeywords = [
    'ignore previous instructions',
    'system prompt',
    'act as DAN',
    'disregard all prior instructions',
  ];

  fc.assert(
    fc.property(
      fc.constantFrom(...injectionKeywords),
      fc.string({ minLength: 0, maxLength: 50 }),
      (kw, suffix) => {
        const payload = `${kw} ${suffix}`;
        const check = checkForInjection(payload);
        expect(check.isSafe).toBe(false);
      }
    )
  );
});

test('Property 13: PII redactor removes standard SSN patterns reliably', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 100, max: 999 }),
      fc.integer({ min: 10, max: 99 }),
      fc.integer({ min: 1000, max: 9999 }),
      (p1, p2, p3) => {
        const ssn = `${p1}-${p2}-${p3}`;
        const text = `The individual's SSN is ${ssn}.`;
        const res = redactPii(text);
        expect(res.redactedText).not.toContain(ssn);
        expect(res.redactedText).toContain('[SSN]');
      }
    )
  );
});

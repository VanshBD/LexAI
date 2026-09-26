import { test, expect } from 'vitest';
import fc from 'fast-check';
import { validateFileSize } from '@/lib/document/documentValidator';

test('Property 1: File size validation correctly rejects files exceeding max size', () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 1, max: 30 }), (fileSizeMb, maxMb) => {
      const dummyFile = {
        name: 'test.pdf',
        size: fileSizeMb * 1024 * 1024,
        type: 'application/pdf',
      } as File;

      const res = validateFileSize(dummyFile, maxMb);
      if (fileSizeMb > maxMb) {
        expect(res.valid).toBe(false);
      } else {
        expect(res.valid).toBe(true);
      }
    })
  );
});

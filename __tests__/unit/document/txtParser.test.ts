import { describe, it, expect, vi } from 'vitest';
import { parseTxt } from '@/lib/document/txtParser';

describe('txtParser', () => {
  it('parses a text file and returns ParsedDocument structure', async () => {
    const textContent = 'This is a sample confidentiality agreement between parties.';
    const file = new File([textContent], 'nda.txt', { type: 'text/plain' });

    const doc = await parseTxt(file);
    expect(doc.name).toBe('nda.txt');
    expect(doc.text).toBe(textContent);
    expect(doc.format).toBe('txt');
    expect(doc.wordCount).toBe(8);
    expect(doc.id).toBeDefined();
    expect(doc.parsedAt).toBeGreaterThan(0);
  });
});

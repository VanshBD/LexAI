import { describe, it, expect, vi } from 'vitest';
import { parseDocx } from '@/lib/document/docxParser';
import { parsePdf } from '@/lib/document/pdfParser';

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: 'Extracted docx contract text.' }),
  },
}));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  version: '4.9.155',
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 2,
      getPage: vi.fn().mockResolvedValue({
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Page' }, { str: 'content' }],
        }),
      }),
    }),
  }),
}));

describe('docxParser & pdfParser', () => {
  it('parses docx file and extracts raw text', async () => {
    const file = {
      name: 'contract.docx',
      arrayBuffer: async () => new ArrayBuffer(8),
    } as unknown as File;

    const doc = await parseDocx(file);
    expect(doc.name).toBe('contract.docx');
    expect(doc.text).toBe('Extracted docx contract text.');
    expect(doc.format).toBe('docx');
  });

  it('parses pdf file and extracts multi-page text', async () => {
    const file = {
      name: 'document.pdf',
      arrayBuffer: async () => new ArrayBuffer(8),
    } as unknown as File;

    const doc = await parsePdf(file);
    expect(doc.name).toBe('document.pdf');
    expect(doc.pageCount).toBe(2);
    expect(doc.format).toBe('pdf');
  });
});

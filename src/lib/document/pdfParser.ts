import { ParsedDocument } from '@/types/document';

/**
 * Parses a PDF file in the browser using pdfjs-dist.
 * Extracts plain text across all pages and calculates word and page counts.
 *
 * @param file - The PDF file to parse.
 * @returns Promise<ParsedDocument>
 */
export async function parsePdf(file: File): Promise<ParsedDocument> {
  const pdfjs = await import('pdfjs-dist');

  // Configure worker source if in browser environment
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '4.9.155'}/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const textPieces: string[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => (typeof item.str === 'string' ? item.str : ''))
      .join(' ')
      .trim();
    if (pageText) {
      textPieces.push(pageText);
    }
  }

  const fullText = textPieces.join('\n\n').trim();
  const wordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;

  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pdf-${Date.now()}`,
    name: file.name,
    text: fullText,
    wordCount,
    pageCount,
    format: 'pdf',
    parsedAt: Date.now(),
  };
}

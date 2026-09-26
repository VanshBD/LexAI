import { ParsedDocument } from '@/types/document';
import mammoth from 'mammoth';

/**
 * Parses a DOCX file client-side using mammoth.
 * Extracts raw plain text and computes word count.
 *
 * @param file - The DOCX file to parse.
 * @returns Promise<ParsedDocument>
 */
export async function parseDocx(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const fullText = (result.value || '').trim();
  const wordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;

  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `docx-${Date.now()}`,
    name: file.name,
    text: fullText,
    wordCount,
    format: 'docx',
    parsedAt: Date.now(),
  };
}

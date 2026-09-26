import { ParsedDocument } from '@/types/document';

/**
 * Parses a plain text (.txt) file in the browser using FileReader.
 *
 * @param file - The TXT file to parse.
 * @returns Promise<ParsedDocument>
 */
export async function parseTxt(file: File): Promise<ParsedDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const fullText = typeof reader.result === 'string' ? reader.result.trim() : '';
      const wordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;

      resolve({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `txt-${Date.now()}`,
        name: file.name,
        text: fullText,
        wordCount,
        format: 'txt',
        parsedAt: Date.now(),
      });
    };

    reader.onerror = () => {
      reject(new Error('Failed to read text file'));
    };

    reader.readAsText(file);
  });
}

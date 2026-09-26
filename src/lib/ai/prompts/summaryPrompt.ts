export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'summary';

export function buildSummaryPrompt(documentText: string): string {
  return `You are a legal document analyzer. Analyze the following legal document and produce a plain-language summary.

RULES:
- Use simple language (Flesch-Kincaid grade level 8 or below)
- Structure the summary into labeled sections that mirror the document's own section headings
- Each section must have a "title" and "content" field
- At the end, always include a disclaimer section
- Return ONLY valid JSON in this exact format:
{
  "sections": [
    { "title": "Section Name", "content": "Plain language explanation..." }
  ],
  "disclaimer": "This summary is for informational purposes only and does not constitute legal advice. Always consult a licensed attorney."
}

DOCUMENT:
${documentText}`;
}

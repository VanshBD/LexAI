export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'comparison';

export function buildComparisonPrompt(textA: string, textB: string): string {
  return `You are a legal document comparison expert. Compare the two legal documents below and identify all differences, conflicts, and missing clauses.

Return ONLY valid JSON in this exact format:
{
  "differences": [
    { "clauseA": "Text from doc A", "clauseB": "Text from doc B", "description": "How they differ" }
  ],
  "conflicts": [
    { "clauseA": "Text from doc A", "clauseB": "Text from doc B", "summary": "Nature of conflict" }
  ],
  "missing": [
    { "clause": "Missing clause text", "missingFrom": "A|B", "documentName": "Document name" }
  ]
}

DOCUMENT A:
${textA}

DOCUMENT B:
${textB}`;
}

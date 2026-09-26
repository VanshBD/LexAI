export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'checklist';

export function buildChecklistPrompt(documentText: string): string {
  return `You are a legal document analyst. Extract all obligations, rights, deadlines, and required actions from this document.

Return ONLY valid JSON in this exact format:
{
  "items": {
    "Your Obligations": [
      { "id": "uuid-1", "text": "Action or obligation description", "clauseRef": "Section 3.2 or null" }
    ],
    "Your Rights": [],
    "Important Deadlines": [],
    "Actions Required Before Signing": []
  }
}

Rules:
- Every heading ("Your Obligations", "Your Rights", "Important Deadlines", "Actions Required Before Signing") must be present in items even if empty (use empty array [])
- clauseRef should be the section number/title if identifiable, otherwise null
- Be specific and actionable

DOCUMENT:
${documentText}`;
}

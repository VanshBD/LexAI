export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'riskGraph';

export function buildRiskGraphPrompt(documentText: string, comparisonText?: string): string {
  return `You are a legal risk analyst. Analyze the following legal document and identify all key clauses.

For each clause, assess:
- Risk level: "critical" (needs immediate attention), "moderate" (review carefully), or "low" (standard clause)
- Relationships to other clauses (references, dependencies, conflicts)

Return ONLY valid JSON in this exact format:
{
  "clauses": [
    {
      "clauseId": "unique-id-1",
      "title": "Clause Title",
      "text": "Original clause text...",
      "riskLevel": "critical|moderate|low",
      "riskReason": "Why this risk level was assigned",
      "relatedClauses": ["unique-id-2", "unique-id-3"]
    }
  ]
}

${comparisonText ? `DOCUMENT A:\n${documentText}\n\nDOCUMENT B:\n${comparisonText}` : `DOCUMENT:\n${documentText}`}`;
}

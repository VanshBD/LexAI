export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'attorneyPack';

export function buildAttorneyPackPrompt(
  documentText: string,
  summaryText: string,
  riskGraphData?: { nodes?: Array<{ data: { title: string; riskLevel: string; riskReason: string } }> }
): string {
  const highRiskClauses = (riskGraphData?.nodes || [])
    .filter((n) => n.data?.riskLevel === 'critical' || n.data?.riskLevel === 'moderate')
    .map((n) => `- ${n.data.title}: ${n.data.riskReason}`)
    .join('\n');

  return `You are a legal preparation specialist. Generate 8-15 specific questions a person should ask their attorney about this document.

Return ONLY valid JSON in this exact format:
{
  "headings": [
    { "key": "understanding-rights", "label": "Understanding Your Rights" },
    { "key": "clarifying-obligations", "label": "Clarifying Your Obligations" },
    { "key": "identifying-risks", "label": "Identifying Risks" },
    { "key": "before-signing", "label": "Before You Sign" }
  ],
  "questionsByHeading": {
    "understanding-rights": ["Question 1?", "Question 2?"],
    "clarifying-obligations": [],
    "identifying-risks": [],
    "before-signing": []
  },
  "disclaimer": "These questions are starting points. Your attorney may identify additional relevant issues."
}

Rules:
- Every question must reference a SPECIFIC element from this document (clause, term, date, party name)
- No generic questions — every question must be document-specific
- Total questions across all headings must be between 8 and 15
- Distribute questions across all 4 headings

${highRiskClauses ? `HIGH RISK CLAUSES IDENTIFIED:\n${highRiskClauses}\n` : ''}

DOCUMENT SUMMARY:
${summaryText}

DOCUMENT:
${documentText}`;
}

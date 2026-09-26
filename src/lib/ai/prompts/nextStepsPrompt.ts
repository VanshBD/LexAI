export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'nextSteps';

export function buildNextStepsPrompt(documentText: string, summaryText: string): string {
  return `You are a legal guidance assistant. Based on this document and its summary, provide 3-7 concrete next steps the user should consider.

Return ONLY valid JSON in this exact format:
{
  "steps": [
    {
      "id": "step-1",
      "text": "Specific action to take",
      "category": "Do Now",
      "isTimeSensitive": true,
      "deadline": null
    }
  ],
  "disclaimer": "These suggestions are informational only and do not constitute legal advice."
}

Rules:
- category must be exactly one of: "Do Now", "Do Soon", "Optional"
- "Do Now" = urgent, within 7 days or has a near deadline
- "Do Soon" = important, within 30 days
- "Optional" = good practice but not time-bound
- Total number of steps MUST be between 3 and 7
- At least one step must explicitly recommend consulting a licensed attorney
- Extract any explicit deadlines from the document text if available, otherwise null

DOCUMENT SUMMARY:
${summaryText}

DOCUMENT:
${documentText}`;
}

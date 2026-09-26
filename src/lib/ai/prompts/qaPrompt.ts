export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'qa';

export function buildQAPrompt(
  question: string,
  chunks: Array<{ text: string; chunkId: string }>,
  history: Array<{ role: string; content: string }>
): string {
  const context = chunks.map((c, i) => `[Chunk ${i + 1}]: ${c.text}`).join('\n\n');
  const historyText = history.map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');

  return `You are a legal document assistant. Answer the user's question based ONLY on the provided document excerpts.

RULES:
- If the answer cannot be found in the provided excerpts, respond with exactly: "I cannot find relevant information about this in the provided document."
- Always cite the specific section or clause your answer is based on
- After your answer, on a new line, add: CONFIDENCE: [0-100] where 0=uncertain, 100=certain
- After confidence, add: CITATION: [exact clause or section reference]
- Keep answers factual and informational, not advisory

DOCUMENT EXCERPTS:
${context}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ''}

USER QUESTION: ${question}`;
}

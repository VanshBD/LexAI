/**
 * Approximates the number of tokens in a text string.
 * Uses the Math.ceil(text.length / 4) heuristic.
 * @param text - The input string to count tokens for.
 * @returns Approximate token count.
 */
export function approximateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

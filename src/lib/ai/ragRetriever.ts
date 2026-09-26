import { TextChunk } from './ragChunker';

/**
 * Retrieves the top-K most relevant chunks using a BM25 / term-frequency scoring approach.
 * Tokenizes the query into lowercase alphanumeric words, scores each chunk by word match count,
 * and returns topK items sorted by score descending.
 *
 * @param query - The user question or search string.
 * @param chunks - All available chunks of the document.
 * @param topK - Maximum number of chunks to return (default: 5).
 * @returns Sorted array of the top-K relevant TextChunk objects.
 */
export function retrieveTopChunks(query: string, chunks: TextChunk[], topK = 5): TextChunk[] {
  if (!query || !query.trim() || !chunks || chunks.length === 0) {
    return (chunks || []).slice(0, topK);
  }

  const queryTerms = query
    .toLowerCase()
    .split(/\W+/)
    .filter((term) => term.length > 2); // Filter out 1-2 char stop words

  if (queryTerms.length === 0) {
    return chunks.slice(0, topK);
  }

  const scored = chunks.map((chunk) => {
    const textLower = chunk.text.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      // Count occurrences of term in chunk
      let pos = 0;
      while ((pos = textLower.indexOf(term, pos)) !== -1) {
        score++;
        pos += term.length;
      }
    }

    return { chunk, score };
  });

  // Sort descending by score. If tied, keep document order.
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map((item) => item.chunk);
}

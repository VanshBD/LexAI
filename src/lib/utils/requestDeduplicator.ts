/**
 * Pending-request registry.
 * Maps a unique request key to its in-flight Promise<Response>.
 */
const pendingRequests = new Map<string, Promise<Response>>();

/**
 * Deduplicates concurrent API requests with the same key within a time window.
 * Returns the existing Promise if a matching request is already in-flight.
 * @param key - Unique request key (e.g., 'summarize_docId123').
 * @param requestFn - Factory function that creates the actual fetch Promise.
 * @param windowMs - Deduplication window in milliseconds. Default: 500.
 * @returns The (possibly shared) Promise for this request.
 */
export function deduplicateRequest(
  key: string,
  requestFn: () => Promise<Response>,
  windowMs = 500,
): Promise<Response> {
  // Return the existing in-flight promise if one exists for this key
  const existing = pendingRequests.get(key);
  if (existing) {
    return existing;
  }

  // Create the new request promise
  const promise = requestFn().finally(() => {
    // Remove the entry after the promise settles (resolve or reject)
    pendingRequests.delete(key);
  });

  // Register in the map
  pendingRequests.set(key, promise);

  // Auto-remove after the deduplication window even if still pending,
  // so a fresh request can be issued after `windowMs` regardless.
  setTimeout(() => {
    if (pendingRequests.get(key) === promise) {
      pendingRequests.delete(key);
    }
  }, windowMs);

  return promise;
}

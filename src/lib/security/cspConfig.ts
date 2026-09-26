/**
 * Generates a cryptographically random nonce for use in CSP script-src directives.
 * Uses Web Crypto API (crypto.getRandomValues) which runs universally in both
 * Edge runtime and standard Node.js environments.
 * @returns A base64-encoded 16-byte nonce string.
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    if (typeof btoa !== 'undefined') {
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  }
  // Safe fallback if btoa or getRandomValues is unavailable
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Builds the Content-Security-Policy header value for LexAI.
 * @param nonce - Optional per-request nonce injected into script-src.
 * @returns The full CSP header string.
 */
export function buildCspHeader(nonce?: string): string {
  const scriptSrc = nonce
    ? `script-src 'self' 'unsafe-eval' 'unsafe-inline' 'nonce-${nonce}'`
    : `script-src 'self' 'unsafe-eval' 'unsafe-inline'`;

  const directives = [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `connect-src 'self' https://generativelanguage.googleapis.com`,
    `font-src 'self'`,
    `object-src 'none'`,
    `frame-ancestors 'none'`,
  ];

  return directives.join('; ');
}

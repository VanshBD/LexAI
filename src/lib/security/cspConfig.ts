import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically random nonce for use in CSP script-src directives.
 * @returns A base64-encoded 16-byte nonce string.
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

/**
 * Builds the Content-Security-Policy header value for LexAI.
 * @param nonce - Optional per-request nonce injected into script-src.
 * @returns The full CSP header string.
 */
export function buildCspHeader(nonce?: string): string {
  const scriptSrc = nonce
    ? `script-src 'self' 'nonce-${nonce}'`
    : `script-src 'self'`;

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

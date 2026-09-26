/**
 * Type definitions for document ingestion and validation.
 *
 * Covers Requirements: 1.1 (accepted formats), 1.3 (max file size),
 * 1.7 (unsupported format error), 1.8 (parsed document metadata).
 */

// ---------------------------------------------------------------------------
// ParsedDocument
// ---------------------------------------------------------------------------

/** Supported document formats that LexAI can parse client-side. */
export type DocumentFormat = 'pdf' | 'docx' | 'txt';

/**
 * The result of successfully parsing an uploaded legal document.
 *
 * @property id        - Client-generated UUID uniquely identifying this document within the session.
 * @property name      - Original file name (e.g., "contract.pdf").
 * @property text      - Full extracted plain text — the only content forwarded to the Gemini API.
 * @property wordCount - Number of whitespace-delimited words in `text`.
 * @property pageCount - Number of pages; present only for PDF documents.
 * @property format    - The file format detected during parsing.
 * @property parsedAt  - Unix timestamp (ms) when parsing completed.
 */
export interface ParsedDocument {
  /** Client-generated UUID (crypto.randomUUID) uniquely identifying this document in the session. */
  id: string;
  /** Original filename as provided by the user's file system. */
  name: string;
  /** Full extracted plain text — never the raw file bytes. */
  text: string;
  /** Approximate word count derived from splitting `text` on whitespace. */
  wordCount: number;
  /** Number of pages; only present for PDF documents. */
  pageCount?: number;
  /** Detected file format used for routing to the correct parser. */
  format: DocumentFormat;
  /** Unix timestamp (milliseconds) recorded immediately after parsing completes. */
  parsedAt: number;
}

// ---------------------------------------------------------------------------
// DocumentError
// ---------------------------------------------------------------------------

/**
 * Error codes for document validation and parsing failures.
 *
 * - `UNSUPPORTED_FORMAT`  — File type is not PDF, DOCX, or TXT (Req 1.1, 1.7).
 * - `FILE_TOO_LARGE`      — File exceeds the 10 MB per-document limit (Req 1.3).
 * - `TOO_MANY_DOCUMENTS`  — User attempted to upload more than 2 documents (Req 1.5).
 * - `PARSE_ERROR`         — The file could not be parsed despite a supported format.
 */
export type DocumentErrorCode =
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'TOO_MANY_DOCUMENTS'
  | 'PARSE_ERROR';

/**
 * Structured error returned when document ingestion fails.
 *
 * @property code    - Machine-readable error code identifying the failure category.
 * @property message - Human-readable description suitable for display in an ErrorBanner.
 */
export interface DocumentError {
  /** Machine-readable failure category. */
  code: DocumentErrorCode;
  /** User-facing error message describing the problem and any corrective action. */
  message: string;
}

// ---------------------------------------------------------------------------
// ValidationResult
// ---------------------------------------------------------------------------

/**
 * Discriminated union representing the outcome of a document validation check.
 *
 * When `valid` is `true` the check passed and no error is present.
 * When `valid` is `false` the check failed and `error` describes why.
 *
 * @example
 * ```ts
 * const result = validateFileType(file);
 * if (!result.valid) {
 *   showError(result.error.message);
 * }
 * ```
 */
export type ValidationResult =
  | { valid: true }
  | { valid: false; error: DocumentError };

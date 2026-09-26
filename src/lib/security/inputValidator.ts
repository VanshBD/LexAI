/**
 * Server-side input validation and sanitization utilities.
 * Validates request payload sizes, string lengths, and prevents denial-of-service
 * or buffer-overflow patterns before processing.
 */

export interface ValidationCheckResult {
  valid: boolean;
  error?: string;
}

const MAX_DOCUMENT_LENGTH = 100_000; // ~25k tokens max per legal analysis payload
const MAX_QUESTION_LENGTH = 2_000;    // ~500 tokens max per user question

/**
 * Validates document text input length and basic formatting.
 */
export function validateDocumentInput(text: unknown): ValidationCheckResult {
  if (typeof text !== 'string') {
    return { valid: false, error: 'Document text must be a valid string.' };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Document text cannot be empty.' };
  }
  if (trimmed.length > MAX_DOCUMENT_LENGTH) {
    return {
      valid: false,
      error: `Document text exceeds maximum allowed length of ${MAX_DOCUMENT_LENGTH} characters.`,
    };
  }
  return { valid: true };
}

/**
 * Validates user query string length for Q&A.
 */
export function validateQuestionInput(question: unknown): ValidationCheckResult {
  if (typeof question !== 'string') {
    return { valid: false, error: 'Question must be a valid string.' };
  }
  const trimmed = question.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Question cannot be empty.' };
  }
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return {
      valid: false,
      error: `Question exceeds maximum allowed length of ${MAX_QUESTION_LENGTH} characters.`,
    };
  }
  return { valid: true };
}

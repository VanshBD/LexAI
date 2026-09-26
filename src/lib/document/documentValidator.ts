import { ValidationResult } from '@/types/document';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

/**
 * Validates whether the given file has a supported format (.pdf, .docx, .txt).
 * Checks both the file extension and MIME type.
 *
 * @param file - The file to validate.
 * @returns ValidationResult with status and error if invalid.
 */
export function validateFileType(file: File): ValidationResult {
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  const hasValidMime = file.type ? ALLOWED_MIME_TYPES.includes(file.type) : true;

  if (!hasValidExtension || !hasValidMime) {
    return {
      valid: false,
      error: {
        code: 'UNSUPPORTED_FORMAT',
        message: 'Unsupported file format. Please upload a PDF (.pdf), Word document (.docx), or plain text file (.txt).',
      },
    };
  }

  return { valid: true };
}

/**
 * Validates that the uploaded file size is within the allowed limit (default 10 MB).
 *
 * @param file - The file to check.
 * @param maxMb - Maximum allowed file size in megabytes (default: 10).
 * @returns ValidationResult with status and error if file is too large.
 */
export function validateFileSize(file: File, maxMb = 10): ValidationResult {
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds the ${maxMb}MB limit. Please upload a smaller file.`,
      },
    };
  }

  return { valid: true };
}

/**
 * Validates that adding another document will not exceed the maximum allowed document count (default 2).
 *
 * @param currentCount - Current count of uploaded documents.
 * @param maxCount - Maximum allowed document count (default: 2).
 * @returns ValidationResult with status and error if limit reached.
 */
export function validateFileCount(currentCount: number, maxCount = 2): ValidationResult {
  if (currentCount >= maxCount) {
    return {
      valid: false,
      error: {
        code: 'TOO_MANY_DOCUMENTS',
        message: `Maximum of ${maxCount} documents allowed per session. Please remove a document first.`,
      },
    };
  }

  return { valid: true };
}

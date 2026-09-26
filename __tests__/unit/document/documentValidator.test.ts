import { describe, it, expect } from 'vitest';
import {
  validateFileType,
  validateFileSize,
  validateFileCount,
} from '@/lib/document/documentValidator';

describe('documentValidator', () => {
  describe('validateFileType', () => {
    it('accepts valid PDF, DOCX, and TXT files', () => {
      const pdf = new File(['content'], 'agreement.pdf', { type: 'application/pdf' });
      const docx = new File(['content'], 'contract.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const txt = new File(['content'], 'notes.txt', { type: 'text/plain' });

      expect(validateFileType(pdf).valid).toBe(true);
      expect(validateFileType(docx).valid).toBe(true);
      expect(validateFileType(txt).valid).toBe(true);
    });

    it('rejects unsupported extensions', () => {
      const exe = new File(['content'], 'virus.exe', { type: 'application/x-msdownload' });
      const res = validateFileType(exe);
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error.code).toBe('UNSUPPORTED_FORMAT');
      }
    });
  });

  describe('validateFileSize', () => {
    it('accepts files within 10MB', () => {
      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'doc.pdf');
      expect(validateFileSize(file, 10).valid).toBe(true);
    });

    it('rejects files larger than 10MB', () => {
      const file = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.pdf');
      const res = validateFileSize(file, 10);
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error.code).toBe('FILE_TOO_LARGE');
      }
    });
  });

  describe('validateFileCount', () => {
    it('allows adding documents when under maxCount', () => {
      expect(validateFileCount(0, 2).valid).toBe(true);
      expect(validateFileCount(1, 2).valid).toBe(true);
    });

    it('rejects when currentCount reaches or exceeds maxCount', () => {
      const res = validateFileCount(2, 2);
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error.code).toBe('TOO_MANY_DOCUMENTS');
      }
    });
  });
});

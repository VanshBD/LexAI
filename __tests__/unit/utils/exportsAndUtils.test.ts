import { describe, it, expect, vi } from 'vitest';
import { generateNonce, buildCspHeader } from '@/lib/security/cspConfig';
import { deduplicateRequest } from '@/lib/utils/requestDeduplicator';
import { copyToClipboard } from '@/lib/export/clipboardExporter';
import { exportToPdf } from '@/lib/export/pdfExporter';

vi.mock('jspdf', () => {
  return {
    default: class MockJsPdf {
      setFont() {}
      setFontSize() {}
      splitTextToSize() {
        return ['mock line 1', 'mock line 2'];
      }
      text() {}
      addPage() {}
      save() {}
      addImage() {}
    },
  };
});

describe('security, utils & exporters', () => {
  it('generates nonces and builds CSP headers', () => {
    const nonce = generateNonce();
    expect(nonce).toBeDefined();
    expect(nonce.length).toBeGreaterThan(10);

    const csp = buildCspHeader(nonce);
    expect(csp).toContain(`nonce-${nonce}`);
    expect(csp).toContain("default-src 'self'");
  });

  it('deduplicates concurrent requests with same key', async () => {
    let callCount = 0;
    const fetchMock = () => {
      callCount++;
      return new Promise<Response>((resolve) =>
        setTimeout(() => resolve(new Response('ok')), 50)
      );
    };

    const p1 = deduplicateRequest('key1', fetchMock, 200);
    const p2 = deduplicateRequest('key1', fetchMock, 200);

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe(r2);
    expect(callCount).toBe(1);
  });

  it('copies text to clipboard', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    await expect(copyToClipboard('Legal text')).resolves.toBeUndefined();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Legal text');
  });

  it('exports plain text to pdf', async () => {
    await expect(exportToPdf('Agreement text', 'test.pdf')).resolves.toBeUndefined();
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import { copyToClipboard } from '@/lib/export/clipboardExporter';
import { exportToPdf } from '@/lib/export/pdfExporter';

vi.mock('jspdf', () => {
  return {
    default: class MockJsPdf {
      setFont() {}
      setFontSize() {}
      splitTextToSize(_text: string, _max: number) {
        // Return 65 lines to trigger pagination in text loop (cursorY > 780)
        return Array.from({ length: 65 }, (_, i) => `Paragraph line ${i + 1}`);
      }
      text() {}
      addPage() {}
      save() {}
      addImage() {}
    },
  };
});

vi.mock('html2canvas', () => {
  return {
    default: vi.fn().mockResolvedValue({
      width: 800,
      height: 1600, // triggers multi-page loop
      toDataURL: () => 'data:image/png;base64,mock',
    }),
  };
});

describe('clipboardExporter comprehensive suite', () => {
  const originalNavigator = { ...global.navigator };

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  it('uses navigator.clipboard.writeText when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(global, 'navigator', {
      value: { clipboard: { writeText } },
      writable: true,
    });

    await copyToClipboard('test copy');
    expect(writeText).toHaveBeenCalledWith('test copy');
  });

  it('falls back to execCommand when navigator.clipboard throws', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(global, 'navigator', {
      value: { clipboard: { writeText } },
      writable: true,
    });

    const mockExec = vi.fn().mockReturnValue(true);
    (document as unknown as { execCommand: (cmd: string) => boolean }).execCommand = mockExec;

    await copyToClipboard('fallback copy');
    expect(mockExec).toHaveBeenCalledWith('copy');
  });

  it('falls back to textarea execCommand if navigator.clipboard is absent', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
    });

    const mockExec = vi.fn().mockReturnValue(true);
    (document as unknown as { execCommand: (cmd: string) => boolean }).execCommand = mockExec;

    await copyToClipboard('no-clipboard copy');
    expect(mockExec).toHaveBeenCalledWith('copy');
  });
});

describe('pdfExporter comprehensive suite', () => {
  it('exports plain text and formats extension', async () => {
    await expect(exportToPdf('Short summary text', 'custom-name')).resolves.toBeUndefined();
    await expect(exportToPdf('Long summary text', 'custom-name.pdf')).resolves.toBeUndefined();
  });

  it('exports HTML element and handles pagination', async () => {
    const element = document.createElement('div');
    element.innerHTML = '<h1>Legal Document</h1><p>Clauses and details...</p>';
    document.body.appendChild(element);

    await expect(exportToPdf(element, 'element-export.pdf')).resolves.toBeUndefined();
    document.body.removeChild(element);
  });
});

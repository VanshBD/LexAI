import { describe, it, expect } from 'vitest';
import { approximateTokens } from '@/lib/utils/tokenCounter';
import { RISK_COLOR_MAP, getContrastRatio } from '@/lib/utils/colorUtils';

describe('utils', () => {
  it('approximates tokens with length / 4 heuristic', () => {
    expect(approximateTokens('')).toBe(0);
    expect(approximateTokens('abcd')).toBe(1);
    expect(approximateTokens('12345678')).toBe(2);
  });

  it('guarantees WCAG 2.1 AA 4.5:1 contrast for all risk colors', () => {
    (['critical', 'moderate', 'low'] as const).forEach((level) => {
      const { bg, text } = RISK_COLOR_MAP[level];
      const ratio = getContrastRatio(bg, text);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});

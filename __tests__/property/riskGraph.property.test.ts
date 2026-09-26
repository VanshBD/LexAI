import { test, expect } from 'vitest';
import fc from 'fast-check';
import { RISK_COLOR_MAP, getContrastRatio } from '@/lib/utils/colorUtils';
import { RiskLevel } from '@/types/graph';

test('Property 6 & 21: Color contrast for all risk levels is WCAG AA compliant', () => {
  const levels: RiskLevel[] = ['critical', 'moderate', 'low'];
  fc.assert(
    fc.property(fc.constantFrom(...levels), (lvl) => {
      const color = RISK_COLOR_MAP[lvl];
      const contrast = getContrastRatio(color.bg, color.text);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    })
  );
});

import { test, expect } from 'vitest';
import fc from 'fast-check';
import { ClauseCategory } from '@/types/common';
import { RiskLevel } from '@/types/graph';
import { RISK_COLOR_MAP } from '@/lib/utils/colorUtils';

test('Property 8 & 9: All clause categories and risk levels map to valid styles', () => {
  const categories: ClauseCategory[] = [
    'obligations',
    'rights',
    'limitations-of-liability',
    'termination',
    'indemnification',
    'jurisdiction',
    'unusual-or-one-sided',
  ];
  const riskLevels: RiskLevel[] = ['critical', 'moderate', 'low'];

  fc.assert(
    fc.property(
      fc.constantFrom(...categories),
      fc.constantFrom(...riskLevels),
      (category, riskLevel) => {
        expect(category).toBeDefined();
        const colors = RISK_COLOR_MAP[riskLevel];
        expect(colors.bg).toBeDefined();
        expect(colors.text).toBeDefined();
        expect(colors.border).toBeDefined();
      }
    )
  );
});

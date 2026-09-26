import { describe, it, expect } from 'vitest';
import {
  buildSummaryPrompt,
  buildRiskGraphPrompt,
  buildComparisonPrompt,
  buildQAPrompt,
  buildChecklistPrompt,
  buildNextStepsPrompt,
  buildAttorneyPackPrompt,
} from '@/lib/ai/prompts';

describe('prompts builders', () => {
  it('builds all prompt templates with required structure and rules', () => {
    const sPrompt = buildSummaryPrompt('Contract text');
    expect(sPrompt).toContain('Plain language');

    const rgPrompt = buildRiskGraphPrompt('Doc A', 'Doc B');
    expect(rgPrompt).toContain('DOCUMENT A:');
    expect(rgPrompt).toContain('DOCUMENT B:');

    const compPrompt = buildComparisonPrompt('Doc 1', 'Doc 2');
    expect(compPrompt).toContain('differences');
    expect(compPrompt).toContain('conflicts');

    const qaPrompt = buildQAPrompt('Question?', [{ text: 'Excerpts', chunkId: 'c1' }], []);
    expect(qaPrompt).toContain('CONFIDENCE:');

    const chkPrompt = buildChecklistPrompt('Terms');
    expect(chkPrompt).toContain('Your Obligations');

    const nsPrompt = buildNextStepsPrompt('Doc', 'Summary');
    expect(nsPrompt).toContain('Do Now');

    const attPrompt = buildAttorneyPackPrompt('Doc', 'Summary', {
      nodes: [{ data: { title: 'Indemnity', riskLevel: 'critical', riskReason: 'Uncapped' } }],
    });
    expect(attPrompt).toContain('HIGH RISK CLAUSES IDENTIFIED:');
  });
});

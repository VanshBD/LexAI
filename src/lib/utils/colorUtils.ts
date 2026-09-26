import type { RiskLevel } from '@/types/graph';

export interface ColorEntry {
  bg: string;     // hex background color
  text: string;   // hex text color
  border: string; // hex border color
}

/** WCAG 2.1 AA verified color pairs for clause risk levels (all ≥ 4.5:1 contrast ratio) */
export const RISK_COLOR_MAP: Record<RiskLevel, ColorEntry> = {
  critical: { bg: '#FEE2E2', text: '#7F1D1D', border: '#EF4444' },
  moderate: { bg: '#FEF3C7', text: '#78350F', border: '#F59E0B' },
  low:      { bg: '#D1FAE5', text: '#064E3B', border: '#10B981' },
};

/** Purple color for conflict edges in comparison mode */
export const CONFLICT_EDGE_COLOR = '#7C3AED';

/**
 * Computes WCAG 2.1 relative luminance for a hex color string.
 * @param hex - A hex color string (e.g., '#FF0000' or 'FF0000').
 * @returns Relative luminance in [0, 1].
 */
export function getRelativeLuminance(hex: string): number {
  // Strip leading '#' if present
  const clean = hex.replace(/^#/, '');

  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  // Apply gamma correction per WCAG 2.1 spec
  const linearize = (c: number): number =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Computes the WCAG 2.1 contrast ratio between two hex colors.
 * @param hex1 - First hex color string.
 * @param hex2 - Second hex color string.
 * @returns Contrast ratio in [1, 21].
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);

  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

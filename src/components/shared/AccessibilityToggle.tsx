'use client';

import React from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';

export function AccessibilityToggle() {
  const { isAccessibilityMode, toggleAccessibilityMode } = useAccessibility();

  return (
    <button
      type="button"
      onClick={toggleAccessibilityMode}
      aria-pressed={isAccessibilityMode}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
        isAccessibilityMode
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
      }`}
    >
      {isAccessibilityMode ? 'High Contrast Mode: Active' : 'Toggle High Contrast'}
    </button>
  );
}

import { useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';

/**
 * Returns accessibility mode state and toggle function.
 * When accessibility mode is active, applies high-contrast CSS class and 18px font size to document.body.
 */
export function useAccessibility(): {
  isAccessibilityMode: boolean;
  toggleAccessibilityMode: () => void;
} {
  const isAccessibilityMode = useDocumentStore((state) => state.isAccessibilityMode);
  const toggleAccessibilityMode = useDocumentStore((state) => state.toggleAccessibilityMode);

  useEffect(() => {
    if (isAccessibilityMode) {
      document.body.classList.add('accessibility-mode');
      document.body.style.fontSize = '18px';
    } else {
      document.body.classList.remove('accessibility-mode');
      document.body.style.fontSize = '';
    }
  }, [isAccessibilityMode]);

  return { isAccessibilityMode, toggleAccessibilityMode };
}

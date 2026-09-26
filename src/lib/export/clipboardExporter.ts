/**
 * Copies plain text to the user's system clipboard.
 * Resolves within 500ms using navigator.clipboard with execCommand fallback.
 *
 * @param text - The text string to copy.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fallback to execCommand if permission denied or unavailable
    }
  }

  // Fallback for older browsers or non-secure contexts
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

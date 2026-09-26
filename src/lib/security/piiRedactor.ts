/**
 * PII redaction utility. Replaces personally identifiable information
 * in document text with typed placeholders before sending to the Gemini API.
 */

export interface RedactionResult {
  redactedText: string;
  redactionCount: number;
  /** Maps placeholder token → original matched string. Never transmitted to AI. */
  redactionMap: Map<string, string>;
}

const PII_PATTERNS: Array<{ pattern: RegExp; placeholder: string }> = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, placeholder: '[SSN]' },
  { pattern: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g, placeholder: '[PHONE]' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, placeholder: '[EMAIL]' },
  {
    pattern: /\b\d{1,5}\s[\w\s]{1,30}(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)\b/gi,
    placeholder: '[ADDRESS]',
  },
  { pattern: /\b\d{5}(?:-\d{4})?\b/g, placeholder: '[ZIP]' },
  {
    pattern: /\b(?:passport|license|id)\s*(?:no\.?|number|#)?\s*:?\s*([A-Z0-9]{6,12})\b/gi,
    placeholder: '[ID_NUMBER]',
  },
  { pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, placeholder: '[CARD_NUMBER]' },
  { pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, placeholder: '[IP_ADDRESS]' },
  { pattern: /(?<![.!?]\s)\b([A-Z][a-z]+)\s([A-Z][a-z]+)\b/g, placeholder: '[PERSON_NAME]' },
];

/**
 * Redacts PII from text before it is transmitted to the Gemini API.
 * @param text - Raw document text to sanitize.
 * @returns RedactionResult with redacted text, count, and a map for display purposes only.
 */
export function redactPii(text: string): RedactionResult {
  let redactedText = text;
  let redactionCount = 0;
  const redactionMap = new Map<string, string>();

  for (const { pattern, placeholder } of PII_PATTERNS) {
    redactedText = redactedText.replace(pattern, (match) => {
      redactionCount++;
      redactionMap.set(placeholder, match); // last match wins per placeholder type
      return placeholder;
    });
  }

  return { redactedText, redactionCount, redactionMap };
}

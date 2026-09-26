/**
 * Prompt injection detection. Checks user input for patterns that attempt
 * to override system instructions or jailbreak the AI model.
 */

export interface InjectionCheckResult {
  isSafe: boolean;
  detectedPattern?: string;
}

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:previous|all|prior)\s+instructions?/i,
  /you\s+are\s+now\s+(?:a|an)/i,
  /disregard\s+(?:your|all|the)\s+(?:previous|prior|above)/i,
  /\bsystem\s*prompt\b/i,
  /\bact\s+as\b.*\b(DAN|jailbreak|uncensored|developer\s*mode)\b/i,
  /<\/?(?:script|system|assistant|user)\s*>/i,
  /\[\s*INST\s*\]/i,
  /<\|(?:im_start|im_end|endoftext)\|>/i,
  /override\s+(?:all\s+)?safety\s+guidelines/i,
  /bypass\s+(?:the\s+)?filter/i,
];

/**
 * Checks user input for prompt injection patterns.
 * @param input - The user-provided string to validate.
 * @returns InjectionCheckResult — isSafe is false if any pattern matches.
 */
export function checkForInjection(input: string): InjectionCheckResult {
  for (const pattern of INJECTION_PATTERNS) {
    // Reset regex state in case of global flags
    pattern.lastIndex = 0;
    if (pattern.test(input)) {
      return { isSafe: false, detectedPattern: pattern.source };
    }
  }
  return { isSafe: true };
}

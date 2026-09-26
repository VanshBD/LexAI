import 'server-only';
import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing required environment variable: GEMINI_API_KEY');
    }
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

/**
 * Returns active Gemini model for fast streaming tasks.
 * Uses 'gemini-flash-lite-latest' which is verified active with high throughput.
 */
export function getFlashModel() {
  const ai = getGenAI();
  return ai.getGenerativeModel({
    model: 'gemini-flash-lite-latest',
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
    },
  });
}

/**
 * Returns active Gemini model for complex tasks (Risk Graph, Comparison).
 */
export function getProModel() {
  const ai = getGenAI();
  return ai.getGenerativeModel({
    model: 'gemini-flash-lite-latest',
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
    },
  });
}

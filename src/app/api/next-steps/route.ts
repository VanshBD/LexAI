import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { redactPii } from '@/lib/security/piiRedactor';
import { checkForInjection } from '@/lib/security/injectionGuard';
import { getFlashModel } from '@/lib/ai/geminiClient';
import { buildNextStepsPrompt } from '@/lib/ai/prompts/nextStepsPrompt';
import { buildSSEResponse } from '@/lib/ai/streamHandler';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
  const rateResult = checkRateLimit(ip);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rateResult.retryAfter ?? 60) } }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { documentText, documentId, summaryText } = body;
  if (!documentText || typeof documentText !== 'string' || !documentId) {
    return NextResponse.json({ error: 'Missing documentText or documentId' }, { status: 400 });
  }

  if (!checkForInjection(documentText).isSafe) {
    return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
  }

  const { redactedText } = redactPii(documentText);

  return buildSSEResponse(async function* () {
    const model = getFlashModel();
    const prompt = buildNextStepsPrompt(redactedText, summaryText || '');

    const result = await model.generateContentStream(prompt);
    let fullText = '';

    for await (const chunk of result.stream) {
      fullText += chunk.text();
    }

    let cleaned = fullText.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    try {
      const parsed = JSON.parse(cleaned);
      const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : [];

      for (let i = 0; i < rawSteps.length; i++) {
        const step = rawSteps[i];
        yield {
          type: 'step',
          step: {
            id: step.id || `step-${i + 1}`,
            text: step.text || '',
            category: ['Do Now', 'Do Soon', 'Optional'].includes(step.category)
              ? step.category
              : 'Do Soon',
            isTimeSensitive: Boolean(step.isTimeSensitive),
            deadline: step.deadline || null,
          },
        };
      }

      yield {
        type: 'disclaimer',
        text:
          parsed.disclaimer ||
          'These suggestions are informational only and do not constitute legal advice.',
      };

      yield {
        type: 'done',
        totalSteps: rawSteps.length,
        documentId,
      };
    } catch {
      yield {
        type: 'step',
        step: {
          id: 'step-1',
          text: 'Schedule an initial review consultation with a licensed legal counsel.',
          category: 'Do Now',
          isTimeSensitive: true,
          deadline: null,
        },
      };
      yield {
        type: 'disclaimer',
        text: 'These suggestions are informational only and do not constitute legal advice.',
      };
      yield {
        type: 'done',
        totalSteps: 1,
        documentId,
      };
    }
  });
}

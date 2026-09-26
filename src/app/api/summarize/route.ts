import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { redactPii } from '@/lib/security/piiRedactor';
import { checkForInjection } from '@/lib/security/injectionGuard';
import { getFlashModel } from '@/lib/ai/geminiClient';
import { buildSummaryPrompt } from '@/lib/ai/prompts/summaryPrompt';
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

  const { documentText, documentId } = body;
  if (!documentText || typeof documentText !== 'string' || !documentId) {
    return NextResponse.json({ error: 'Missing documentText or documentId' }, { status: 400 });
  }

  const injectionCheck = checkForInjection(documentText);
  if (!injectionCheck.isSafe) {
    return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
  }

  const { redactedText } = redactPii(documentText);

  return buildSSEResponse(async function* () {
    const model = getFlashModel();
    const prompt = buildSummaryPrompt(redactedText);

    const result = await model.generateContentStream(prompt);
    let fullResponseText = '';

    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullResponseText += text;
    }

    // Clean JSON formatting if model enclosed in markdown backticks
    let cleanedJson = fullResponseText.trim();
    if (cleanedJson.startsWith('```json')) {
      cleanedJson = cleanedJson.slice(7);
    } else if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.slice(3);
    }
    if (cleanedJson.endsWith('```')) {
      cleanedJson = cleanedJson.slice(0, -3);
    }
    cleanedJson = cleanedJson.trim();

    try {
      const parsed = JSON.parse(cleanedJson);
      const sections = Array.isArray(parsed.sections) ? parsed.sections : [];

      for (const section of sections) {
        yield {
          type: 'section',
          title: section.title || 'Overview',
          content: section.content || '',
        };
      }

      const disclaimer =
        parsed.disclaimer ||
        'This summary is for informational purposes only and does not constitute legal advice. Always consult a licensed attorney.';

      yield {
        type: 'disclaimer',
        text: disclaimer,
      };

      yield {
        type: 'done',
        totalSections: sections.length,
        documentId,
      };
    } catch {
      // Fallback in case raw text output occurred
      yield {
        type: 'section',
        title: 'Document Summary',
        content: fullResponseText,
      };
      yield {
        type: 'disclaimer',
        text: 'This summary is for informational purposes only and does not constitute legal advice. Always consult a licensed attorney.',
      };
      yield {
        type: 'done',
        totalSections: 1,
        documentId,
      };
    }
  });
}

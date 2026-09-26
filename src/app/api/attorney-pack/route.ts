import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { redactPii } from '@/lib/security/piiRedactor';
import { checkForInjection } from '@/lib/security/injectionGuard';
import { getFlashModel } from '@/lib/ai/geminiClient';
import { buildAttorneyPackPrompt } from '@/lib/ai/prompts/attorneyPackPrompt';
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

  const { documentText, documentId, summaryText, riskGraphData } = body;
  if (!documentText || typeof documentText !== 'string' || !documentId) {
    return NextResponse.json({ error: 'Missing documentText or documentId' }, { status: 400 });
  }

  if (!checkForInjection(documentText).isSafe) {
    return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
  }

  const { redactedText } = redactPii(documentText);

  return buildSSEResponse(async function* () {
    const model = getFlashModel();
    const prompt = buildAttorneyPackPrompt(redactedText, summaryText || '', riskGraphData);

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
      const headings = Array.isArray(parsed.headings) ? parsed.headings : [];
      const questionsMap = parsed.questionsByHeading || {};
      let totalCount = 0;

      for (const h of headings) {
        yield {
          type: 'heading',
          heading: h,
        };

        const questions = Array.isArray(questionsMap[h.key]) ? questionsMap[h.key] : [];
        for (const q of questions) {
          totalCount++;
          yield {
            type: 'question',
            headingKey: h.key,
            question: q,
          };
        }
      }

      yield {
        type: 'disclaimer',
        text:
          parsed.disclaimer ||
          'These questions are starting points. Your attorney may identify additional relevant issues.',
      };

      yield {
        type: 'done',
        totalQuestions: totalCount,
        documentId,
      };
    } catch {
      yield {
        type: 'heading',
        heading: { key: 'identifying-risks', label: 'Identifying Risks' },
      };
      yield {
        type: 'question',
        headingKey: 'identifying-risks',
        question: 'What are the main financial liability risks in this agreement?',
      };
      yield {
        type: 'disclaimer',
        text:
          'These questions are starting points. Your attorney may identify additional relevant issues.',
      };
      yield {
        type: 'done',
        totalQuestions: 1,
        documentId,
      };
    }
  });
}

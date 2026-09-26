import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { redactPii } from '@/lib/security/piiRedactor';
import { checkForInjection } from '@/lib/security/injectionGuard';
import { validateDocumentInput } from '@/lib/security/inputValidator';
import { getFlashModel } from '@/lib/ai/geminiClient';
import { buildChecklistPrompt } from '@/lib/ai/prompts/checklistPrompt';
import { buildSSEResponse } from '@/lib/ai/streamHandler';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
  const rateResult = checkRateLimit(ip);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateResult.retryAfter ?? 60),
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { documentText, documentId } = body;
  if (!documentId) {
    return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
  }

  const inputCheck = validateDocumentInput(documentText);
  if (!inputCheck.valid) {
    return NextResponse.json({ error: inputCheck.error }, { status: 400 });
  }

  if (!checkForInjection(documentText).isSafe) {
    return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
  }

  const { redactedText } = redactPii(documentText);

  return buildSSEResponse(async function* () {
    const model = getFlashModel();
    const prompt = buildChecklistPrompt(redactedText);

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

    const standardHeadings = [
      'Your Obligations',
      'Your Rights',
      'Important Deadlines',
      'Actions Required Before Signing',
    ];

    try {
      const parsed = JSON.parse(cleaned);
      const itemsMap = parsed.items || {};

      for (const heading of standardHeadings) {
        yield {
          type: 'heading',
          heading,
        };

        const entries = Array.isArray(itemsMap[heading]) ? itemsMap[heading] : [];
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          yield {
            type: 'item',
            headingKey: heading,
            item: {
              id: entry.id || `item-${heading}-${i + 1}`,
              text: entry.text || '',
              clauseRef: entry.clauseRef || null,
              completed: false,
            },
          };
        }
      }

      yield {
        type: 'done',
        documentId,
      };
    } catch {
      for (const heading of standardHeadings) {
        yield { type: 'heading', heading };
      }
      yield {
        type: 'item',
        headingKey: 'Your Obligations',
        item: {
          id: 'item-fallback-1',
          text: 'Review document terms with legal counsel.',
          clauseRef: null,
          completed: false,
        },
      };
      yield { type: 'done', documentId };
    }
  });
}

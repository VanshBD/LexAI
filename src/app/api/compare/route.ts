import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { redactPii } from '@/lib/security/piiRedactor';
import { checkForInjection } from '@/lib/security/injectionGuard';
import { getProModel } from '@/lib/ai/geminiClient';
import { buildComparisonPrompt } from '@/lib/ai/prompts/comparisonPrompt';
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

  const { documentTextA, documentTextB, documentIdA, documentIdB } = body;
  if (!documentTextA || !documentTextB || !documentIdA || !documentIdB) {
    return NextResponse.json({ error: 'Missing document texts or IDs' }, { status: 400 });
  }

  if (!checkForInjection(documentTextA).isSafe || !checkForInjection(documentTextB).isSafe) {
    return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
  }

  const { redactedText: redactedA } = redactPii(documentTextA);
  const { redactedText: redactedB } = redactPii(documentTextB);

  return buildSSEResponse(async function* () {
    const model = getProModel();
    const prompt = buildComparisonPrompt(redactedA, redactedB);

    const result = await model.generateContentStream(prompt);
    let fullResponseText = '';

    for await (const chunk of result.stream) {
      fullResponseText += chunk.text();
    }

    let cleaned = fullResponseText.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    try {
      const parsed = JSON.parse(cleaned);
      const differences = Array.isArray(parsed.differences) ? parsed.differences : [];
      const conflicts = Array.isArray(parsed.conflicts) ? parsed.conflicts : [];
      const missing = Array.isArray(parsed.missing) ? parsed.missing : [];

      for (const diff of differences) {
        yield {
          type: 'difference',
          item: diff,
        };
      }

      for (const conf of conflicts) {
        yield {
          type: 'conflict',
          item: conf,
        };
      }

      for (const miss of missing) {
        yield {
          type: 'missing',
          item: miss,
        };
      }

      yield {
        type: 'done',
        totalDifferences: differences.length,
        totalConflicts: conflicts.length,
        totalMissing: missing.length,
      };
    } catch {
      yield {
        type: 'difference',
        item: {
          clauseA: 'Overview',
          clauseB: 'Overview',
          description: fullResponseText,
        },
      };
      yield {
        type: 'done',
        totalDifferences: 1,
        totalConflicts: 0,
        totalMissing: 0,
      };
    }
  });
}

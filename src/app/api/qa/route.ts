import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { checkForInjection } from '@/lib/security/injectionGuard';
import { getFlashModel } from '@/lib/ai/geminiClient';
import { buildQAPrompt } from '@/lib/ai/prompts/qaPrompt';
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

  const { question, chunks, conversationHistory, documentId } = body;
  if (!question || typeof question !== 'string' || !Array.isArray(chunks)) {
    return NextResponse.json({ error: 'Missing question or chunks' }, { status: 400 });
  }

  const injectionCheck = checkForInjection(question);
  if (!injectionCheck.isSafe) {
    return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
  }

  return buildSSEResponse(async function* () {
    const model = getFlashModel();
    const prompt = buildQAPrompt(question, chunks, conversationHistory || []);

    const result = await model.generateContentStream(prompt);
    let fullText = '';

    for await (const chunk of result.stream) {
      const token = chunk.text();
      fullText += token;
      yield {
        type: 'token',
        content: token,
      };
    }

    // Parse confidence score and citation from full response
    let score = 85;
    let citation: string | null = null;

    const confMatch = fullText.match(/CONFIDENCE:\s*(\d+)/i);
    if (confMatch) {
      score = parseInt(confMatch[1], 10);
    }

    const citMatch = fullText.match(/CITATION:\s*([^\n\r]+)/i);
    if (citMatch) {
      citation = citMatch[1].trim();
    }

    yield {
      type: 'confidence',
      score,
      citation,
      isLowConfidence: score < 60,
    };

    yield {
      type: 'done',
      documentId,
    };
  });
}

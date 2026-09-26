import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { redactPii } from '@/lib/security/piiRedactor';
import { checkForInjection } from '@/lib/security/injectionGuard';
import { getProModel } from '@/lib/ai/geminiClient';
import { buildRiskGraphPrompt } from '@/lib/ai/prompts/riskGraphPrompt';
import { RiskNode, RiskEdge, RiskLevel } from '@/types/graph';

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

  const { documentText, documentId, comparisonDocumentText } = body;
  if (!documentText || typeof documentText !== 'string' || !documentId) {
    return NextResponse.json({ error: 'Missing documentText or documentId' }, { status: 400 });
  }

  const injectionCheck = checkForInjection(documentText);
  if (!injectionCheck.isSafe) {
    return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
  }

  const { redactedText } = redactPii(documentText);
  const comparisonRedacted = comparisonDocumentText ? redactPii(comparisonDocumentText).redactedText : undefined;

  try {
    const model = getProModel();
    const prompt = buildRiskGraphPrompt(redactedText, comparisonRedacted);

    const result = await model.generateContent(prompt);
    let fullResponseText = result.response.text().trim();

    if (fullResponseText.startsWith('```json')) {
      fullResponseText = fullResponseText.slice(7);
    } else if (fullResponseText.startsWith('```')) {
      fullResponseText = fullResponseText.slice(3);
    }
    if (fullResponseText.endsWith('```')) {
      fullResponseText = fullResponseText.slice(0, -3);
    }
    fullResponseText = fullResponseText.trim();

    const parsed = JSON.parse(fullResponseText);
    const rawClauses = Array.isArray(parsed.clauses) ? parsed.clauses : [];

    const nodes: RiskNode[] = [];
    const edges: RiskEdge[] = [];

    rawClauses.forEach((c: any, index: number) => {
      const clauseId = c.clauseId || `clause-${index + 1}`;
      const riskLevel: RiskLevel = ['critical', 'moderate', 'low'].includes(c.riskLevel?.toLowerCase())
        ? (c.riskLevel.toLowerCase() as RiskLevel)
        : 'moderate';

      nodes.push({
        id: clauseId,
        type: 'clauseNode',
        position: { x: (index % 3) * 220, y: Math.floor(index / 3) * 140 },
        data: {
          clauseId,
          title: c.title || `Clause ${index + 1}`,
          shortText: (c.text || '').slice(0, 120),
          fullText: c.text || '',
          riskLevel,
          riskReason: c.riskReason || 'Standard risk assessment applies.',
          plainSummary: c.plainSummary || c.riskReason || '',
          documentIndex: 0,
        },
      });

      if (Array.isArray(c.relatedClauses)) {
        for (const targetId of c.relatedClauses) {
          if (targetId && targetId !== clauseId) {
            edges.push({
              id: `${clauseId}-${targetId}`,
              source: clauseId,
              target: targetId,
              type: 'default',
              label: 'Relates to',
            });
          }
        }
      }
    });

    return NextResponse.json({
      nodes,
      edges,
      documentId,
      generatedAt: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to generate risk graph' },
      { status: 500 }
    );
  }
}

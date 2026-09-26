# LexAI — Agent Handoff & Execution Context

> **READ THIS FIRST.** This file is the complete context for any AI agent (Kiro, Antigravity, Claude, GPT, etc.) continuing this project. Read every section before writing a single line of code. Do not stop until all 119 tasks are complete, the app builds and runs, tests pass, and it is deployed to Vercel.

---

## 1. What This Project Is

**LexAI** — a GenAI-powered legal assistant web app built for the **Google GDG HackToSkill competition**.

**Goal:** Score 100/100 across all 6 evaluation criteria:
1. Code Quality (TypeScript strict, clean structure, JSDoc)
2. Security (no data storage, PII redaction, CSP, rate limiting, no API key leaks)
3. Accessibility (WCAG 2.1 AA, keyboard nav, ARIA, screen reader support)
4. Efficiency (Lighthouse 85+, <3s TTFT, lazy loading, session cache)
5. Testing (80%+ coverage, unit tests + property-based tests with fast-check)
6. Problem Statement Alignment (covers all 7 legal AI use cases)

**Submission deadline:** September 27, 2026.

**Competition requirements:**
- Working live deployed URL (Vercel)
- Public GitHub repo < 10 MB
- Demo video < 4 minutes showing live GenAI usage
- Must use Gemini API (Google) or Groq API — we use **Gemini**
- Must NOT replace professional legal advice — information only

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict mode, zero errors) |
| Styling | Tailwind CSS |
| AI | Google Gemini API (`gemini-1.5-flash` for speed, `gemini-1.5-pro` for complex) |
| State | Zustand (in-memory only, no persistence) |
| Graph viz | React Flow + dagre (lazy-loaded) |
| PDF parsing | pdfjs-dist (client-side) |
| DOCX parsing | mammoth (client-side) |
| PDF export | jsPDF |
| PNG export | html2canvas |
| Testing | Vitest + React Testing Library + fast-check (property-based) |
| CI | GitHub Actions |
| Deployment | Vercel |

---

## 3. Project Location

```
c:\Users\Vansh Dobariya\OneDrive\Desktop\Work-Stuff\HackToSkill\GDG\Project-4-(26-09-026)\AI-Legal\
```

The project is already scaffolded. `npm install` has been run. `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.mjs`, `.eslintrc.json` all exist.

**Spec files (read these for full detail):**
- `.kiro/specs/ai-legal-assistant/requirements.md` — 15 requirements, 80+ acceptance criteria
- `.kiro/specs/ai-legal-assistant/design.md` — full technical design with types, component interfaces, API schemas, security patterns
- `.kiro/specs/ai-legal-assistant/tasks.md` — 119 ordered tasks with dependency graph

---

## 4. Current Build Status (as of handoff)

**19 / 119 tasks complete (16%)**

### ✅ DONE — Foundation Layer

| File | What it is |
|---|---|
| `src/types/document.ts` | ParsedDocument, DocumentError, ValidationResult |
| `src/types/graph.ts` | RiskLevel, RiskNode, ClauseNodeData, RiskEdge, RiskGraphData |
| `src/types/ai.ts` | SummaryResult, QAMessage, NextStep, ComparisonResult, AttorneyPackData |
| `src/types/checklist.ts` | ChecklistHeading, ChecklistEntry, ChecklistData |
| `src/types/common.ts` | FeatureTab, ClauseCategory, HighlightedClause |
| `src/store/documentStore.ts` | Full Zustand store, all 20 actions, no persistence |
| `src/hooks/useDocumentStore.ts` | Typed re-export of store |
| `src/hooks/useSessionCache.ts` | SSR-safe sessionStorage wrapper |
| `src/hooks/useAccessibility.ts` | Accessibility mode toggle, syncs to body class |
| `src/lib/utils/tokenCounter.ts` | `approximateTokens()` — Math.ceil(len/4) |
| `src/lib/utils/colorUtils.ts` | RISK_COLOR_MAP (WCAG verified), getContrastRatio() |
| `src/lib/utils/requestDeduplicator.ts` | 500ms dedup window via Map |
| `src/lib/security/piiRedactor.ts` | 7-pattern PII redaction (SSN, phone, email, address, zip, ID, name) |
| `src/lib/security/injectionGuard.ts` | 7-pattern prompt injection detection |
| `src/lib/security/rateLimiter.ts` | Sliding window, 20 req/min/IP |
| `src/lib/security/cspConfig.ts` | generateNonce() + buildCspHeader() |

### ❌ NOT YET BUILT — Everything below this line

---

## 5. Remaining Tasks (100 tasks — build these in order)

Work through the tasks exactly as listed. Each section below corresponds to tasks in `tasks.md`. Do NOT skip tasks. Do NOT reorder. Complete each task fully before moving to the next.

---

### PHASE 1 — Middleware (Task 5.5)

**Task 5.5** — Create `src/middleware.ts` (this goes at the project root level actually: `middleware.ts` in the root, NOT inside src — Next.js reads it from root)

```typescript
// middleware.ts (at project root, same level as package.json)
import { NextRequest, NextResponse } from 'next/server';
import { buildCspHeader, generateNonce } from '@/lib/security/cspConfig';
import { checkRateLimit } from '@/lib/security/rateLimiter';

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Rate limiting
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const result = checkRateLimit(ip);
    if (!result.allowed) {
      return new NextResponse(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter ?? 60),
        },
      });
    }
  }

  // CSP headers on all routes
  const nonce = generateNonce();
  const csp = buildCspHeader(nonce);
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

### PHASE 2 — Document Processing (Tasks 6.1–6.4)

**Task 6.1** — `src/lib/document/documentValidator.ts`
- `validateFileType(file: File): ValidationResult` — accept .pdf, .docx, .txt only
- `validateFileSize(file: File, maxMb = 10): ValidationResult` — reject > 10MB
- `validateFileCount(currentCount: number, maxCount = 2): ValidationResult`
- All named exports with JSDoc

**Task 6.2** — `src/lib/document/pdfParser.ts`
- `parsePdf(file: File): Promise<ParsedDocument>`
- Use `pdfjs-dist`: `getDocument({ data: arrayBuffer })`, iterate pages, `page.getTextContent()`, join `TextItem.str`
- Set `pdfjs.GlobalWorkerOptions.workerSrc` to CDN or local worker
- Return `{ id: crypto.randomUUID(), name: file.name, text, wordCount, pageCount, format: 'pdf', parsedAt: Date.now() }`
- Must complete within 5 seconds for ≤10MB files

**Task 6.3** — `src/lib/document/docxParser.ts`
- `parseDocx(file: File): Promise<ParsedDocument>`
- Use `mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })`
- Return ParsedDocument with `format: 'docx'`

**Task 6.4** — `src/lib/document/txtParser.ts`
- `parseTxt(file: File): Promise<ParsedDocument>`
- Use `FileReader.readAsText()` wrapped in a Promise
- Return ParsedDocument with `format: 'txt'`

---

### PHASE 3 — AI Service Layer (Tasks 7.1–7.5)

**Task 7.1** — `src/lib/ai/ragChunker.ts`
- Export `TextChunk` interface: `{ chunkId, startOffset, endOffset, tokenCount, text }`
- Export `chunkDocument(text: string, maxTokens = 2000): TextChunk[]`
- Algorithm: split on `/(?<=[.!?])\s+(?=[A-Z])/g`, accumulate sentences up to 1800 tokens, emit chunk, start next with last 2 sentences (overlap), tag with UUID

**Task 7.2** — `src/lib/ai/ragRetriever.ts`
- `retrieveTopChunks(query: string, chunks: TextChunk[], topK = 5): TextChunk[]`
- BM25-style: tokenize query (lowercase, split on /\W+/), score chunks by term-frequency overlap, return top-K sorted descending

**Task 7.3** — `src/lib/ai/geminiClient.ts`
- Add `import 'server-only';` at the top (prevents accidental client import)
- `getFlashModel()` — returns `genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })`
- `getProModel()` — returns `genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })`
- Uses `process.env.GEMINI_API_KEY`

**Task 7.4** — `src/lib/ai/streamHandler.ts`
- `buildSSEResponse(stream: AsyncIterable<any>, transformer: (text: string) => string): Response`
- Creates a ReadableStream, reads Gemini chunks, applies transformer, formats as `data: ${json}\n\n`
- Sets headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`

**Task 7.5** — All prompt files in `src/lib/ai/prompts/`

Create each file below. Each must export `PROMPT_VERSION = 'v1'`, `PROMPT_NAME`, and a build function:

`summaryPrompt.ts`:
```typescript
export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'summary';

export function buildSummaryPrompt(documentText: string): string {
  return `You are a legal document analyzer. Analyze the following legal document and produce a plain-language summary.

RULES:
- Use simple language (Flesch-Kincaid grade level 8 or below)
- Structure the summary into labeled sections that mirror the document's own section headings
- Each section must have a "title" and "content" field
- At the end, always include a disclaimer section
- Return ONLY valid JSON in this exact format:
{
  "sections": [
    { "title": "Section Name", "content": "Plain language explanation..." }
  ],
  "disclaimer": "This summary is for informational purposes only and does not constitute legal advice. Always consult a licensed attorney."
}

DOCUMENT:
${documentText}`;
}
```

`riskGraphPrompt.ts`:
```typescript
export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'riskGraph';

export function buildRiskGraphPrompt(documentText: string, comparisonText?: string): string {
  return `You are a legal risk analyst. Analyze the following legal document and identify all key clauses.

For each clause, assess:
- Risk level: "critical" (needs immediate attention), "moderate" (review carefully), or "low" (standard clause)
- Relationships to other clauses (references, dependencies, conflicts)

Return ONLY valid JSON in this exact format:
{
  "clauses": [
    {
      "clauseId": "unique-id-1",
      "title": "Clause Title",
      "text": "Original clause text...",
      "riskLevel": "critical|moderate|low",
      "riskReason": "Why this risk level was assigned",
      "relatedClauses": ["unique-id-2", "unique-id-3"]
    }
  ]
}

${comparisonText ? `DOCUMENT A:\n${documentText}\n\nDOCUMENT B:\n${comparisonText}` : `DOCUMENT:\n${documentText}`}`;
}
```

`comparisonPrompt.ts`:
```typescript
export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'comparison';

export function buildComparisonPrompt(textA: string, textB: string): string {
  return `You are a legal document comparison expert. Compare the two legal documents below and identify all differences, conflicts, and missing clauses.

Return ONLY valid JSON in this exact format:
{
  "differences": [
    { "clauseA": "Text from doc A", "clauseB": "Text from doc B", "description": "How they differ" }
  ],
  "conflicts": [
    { "clauseA": "Text from doc A", "clauseB": "Text from doc B", "summary": "Nature of conflict" }
  ],
  "missing": [
    { "clause": "Missing clause text", "missingFrom": "A|B", "documentName": "Document name" }
  ]
}

DOCUMENT A:
${textA}

DOCUMENT B:
${textB}`;
}
```

`qaPrompt.ts`:
```typescript
export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'qa';

export function buildQAPrompt(
  question: string,
  chunks: Array<{ text: string; chunkId: string }>,
  history: Array<{ role: string; content: string }>
): string {
  const context = chunks.map((c, i) => `[Chunk ${i + 1}]: ${c.text}`).join('\n\n');
  const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
  
  return `You are a legal document assistant. Answer the user's question based ONLY on the provided document excerpts.

RULES:
- If the answer cannot be found in the provided excerpts, respond with exactly: "I cannot find relevant information about this in the provided document."
- Always cite the specific section or clause your answer is based on
- After your answer, on a new line, add: CONFIDENCE: [0-100] where 0=uncertain, 100=certain
- After confidence, add: CITATION: [exact clause or section reference]
- Keep answers factual and informational, not advisory

DOCUMENT EXCERPTS:
${context}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ''}

USER QUESTION: ${question}`;
}
```

`checklistPrompt.ts`:
```typescript
export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'checklist';

export function buildChecklistPrompt(documentText: string): string {
  return `You are a legal document analyst. Extract all obligations, rights, deadlines, and required actions from this document.

Return ONLY valid JSON in this exact format:
{
  "items": {
    "Your Obligations": [
      { "id": "uuid-1", "text": "Action or obligation description", "clauseRef": "Section 3.2 or null" }
    ],
    "Your Rights": [...],
    "Important Deadlines": [...],
    "Actions Required Before Signing": [...]
  }
}

Rules:
- Every heading must be present even if empty (use empty array [])
- clauseRef should be the section number/title if identifiable, otherwise null
- Be specific and actionable

DOCUMENT:
${documentText}`;
}
```

`nextStepsPrompt.ts`:
```typescript
export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'nextSteps';

export function buildNextStepsPrompt(documentText: string, summaryText: string): string {
  return `You are a legal guidance assistant. Based on this document and its summary, provide 3-7 concrete next steps the user should consider.

Return ONLY valid JSON in this exact format:
{
  "steps": [
    {
      "id": "step-1",
      "text": "Specific action to take",
      "category": "Do Now|Do Soon|Optional",
      "isTimeSensitive": true,
      "deadline": "2024-03-15 or null"
    }
  ],
  "disclaimer": "These suggestions are informational only and do not constitute legal advice."
}

Rules:
- "Do Now" = urgent, within 7 days or has a near deadline
- "Do Soon" = important, within 30 days  
- "Optional" = good practice but not time-bound
- At least one step must recommend consulting a licensed attorney
- Extract any explicit deadlines from the document text

DOCUMENT SUMMARY:
${summaryText}

DOCUMENT:
${documentText}`;
}
```

`attorneyPackPrompt.ts`:
```typescript
export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'attorneyPack';

export function buildAttorneyPackPrompt(
  documentText: string,
  summaryText: string,
  riskGraphData: { nodes: Array<{ data: { title: string; riskLevel: string; riskReason: string } }> }
): string {
  const highRiskClauses = riskGraphData.nodes
    .filter(n => n.data.riskLevel === 'critical' || n.data.riskLevel === 'moderate')
    .map(n => `- ${n.data.title}: ${n.data.riskReason}`)
    .join('\n');

  return `You are a legal preparation specialist. Generate 8-15 specific questions a person should ask their attorney about this document.

Return ONLY valid JSON in this exact format:
{
  "headings": [
    { "key": "understanding-rights", "label": "Understanding Your Rights" },
    { "key": "clarifying-obligations", "label": "Clarifying Your Obligations" },
    { "key": "identifying-risks", "label": "Identifying Risks" },
    { "key": "before-signing", "label": "Before You Sign" }
  ],
  "questionsByHeading": {
    "understanding-rights": ["Question 1?", "Question 2?"],
    "clarifying-obligations": [...],
    "identifying-risks": [...],
    "before-signing": [...]
  },
  "disclaimer": "These questions are starting points. Your attorney may identify additional relevant issues."
}

Rules:
- Every question must reference a SPECIFIC element from this document (clause, term, date, party name)
- No generic questions — every question must be document-specific
- Total questions must be between 8 and 15
- Distribute questions across all 4 headings

HIGH RISK CLAUSES IDENTIFIED:
${highRiskClauses}

DOCUMENT SUMMARY:
${summaryText}

DOCUMENT:
${documentText}`;
}
```

`index.ts` (re-exports all):
```typescript
export * from './summaryPrompt';
export * from './riskGraphPrompt';
export * from './comparisonPrompt';
export * from './qaPrompt';
export * from './checklistPrompt';
export * from './nextStepsPrompt';
export * from './attorneyPackPrompt';
```

---

### PHASE 4 — API Routes (Tasks 8.1–8.7)

All routes go in `app/api/[name]/route.ts`. Each route follows this middleware pattern:

```typescript
// Pattern for every API route:
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { redactPii } from '@/lib/security/piiRedactor';
import { checkForInjection } from '@/lib/security/injectionGuard';
import { getFlashModel } from '@/lib/ai/geminiClient';
import { buildSSEResponse } from '@/lib/ai/streamHandler';

export async function POST(request: NextRequest) {
  // 1. Rate limit
  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const rateResult = checkRateLimit(ip);
  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { 
      status: 429, 
      headers: { 'Retry-After': String(rateResult.retryAfter ?? 60) } 
    });
  }

  // 2. Parse body
  const body = await request.json();

  // 3. Validate inputs (check required fields)
  
  // 4. Injection check on user text inputs
  const injectionCheck = checkForInjection(body.question ?? body.documentText ?? '');
  if (!injectionCheck.isSafe) {
    return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
  }

  // 5. PII redaction
  const { redactedText } = redactPii(body.documentText);

  // 6. Call Gemini and stream response
}
```

**Task 8.1** — `app/api/summarize/route.ts`
- POST body: `{ documentText: string, documentId: string }`
- Use `getFlashModel()`, `buildSummaryPrompt(redactedText)`
- Parse Gemini JSON response, stream as SSE events: `{ type: 'section', title, content }`, then `{ type: 'disclaimer', text }`, then `{ type: 'done', totalSections }`
- On error: stream `{ type: 'error', message }`

**Task 8.2** — `app/api/risk-graph/route.ts`
- POST body: `{ documentText: string, documentId: string, comparisonDocumentText?: string }`
- Use `getProModel()`, `buildRiskGraphPrompt(redactedText, comparisonRedacted?)`
- Parse JSON, convert clauses to RiskNode[] and RiskEdge[] (edges from relatedClauses)
- Return `application/json`: `{ nodes: RiskNode[], edges: RiskEdge[], documentId }`

**Task 8.3** — `app/api/compare/route.ts`
- POST body: `{ documentTextA, documentTextB, documentIdA, documentIdB }`
- Redact PII from both texts
- Use `getProModel()`, `buildComparisonPrompt(redactedA, redactedB)`
- Stream SSE: differences, conflicts, missing items, then summary counts, then done

**Task 8.4** — `app/api/qa/route.ts`
- POST body: `{ question: string, chunks: TextChunk[], conversationHistory: QAHistoryItem[], documentId: string }`
- Run injection check on `question` field
- Use `getFlashModel()`, `buildQAPrompt(question, chunks, history)`
- Parse response for CONFIDENCE and CITATION markers
- Stream SSE: `{ type: 'token', content }`, then `{ type: 'confidence', score, citation }`, then `{ type: 'done' }`

**Task 8.5** — `app/api/checklist/route.ts`
- POST body: `{ documentText: string, documentId: string }`
- Use `getFlashModel()`, `buildChecklistPrompt(redactedText)`
- Parse JSON, generate UUIDs for items missing them
- Stream SSE: `{ type: 'heading', heading }`, `{ type: 'item', headingKey, item }`, `{ type: 'done' }`

**Task 8.6** — `app/api/next-steps/route.ts`
- POST body: `{ documentText, documentId, summaryText }`
- Use `getFlashModel()`, `buildNextStepsPrompt(redactedText, summaryText)`
- Stream SSE: `{ type: 'step', step }`, `{ type: 'disclaimer', text }`, `{ type: 'done', totalSteps }`

**Task 8.7** — `app/api/attorney-pack/route.ts`
- POST body: `{ documentText, documentId, summaryText, riskGraphData }`
- Use `getFlashModel()`, `buildAttorneyPackPrompt(redactedText, summaryText, riskGraphData)`
- Stream SSE: `{ type: 'heading', heading }`, `{ type: 'question', headingKey, question }`, `{ type: 'disclaimer', text }`, `{ type: 'done', totalQuestions }`

---

### PHASE 5 — Core Layout & Shared UI (Tasks 10.1–10.9)

**Task 10.1** — `app/layout.tsx` (replace the scaffolded one)
- Root layout wrapping all pages
- `<html lang="en">`, `<body>`
- Include `DisclaimerModal`, `AppHeader`, `AppFooter`
- ARIA live region: `<div aria-live="polite" aria-atomic="false" className="sr-only" id="live-region" />`
- Import globals.css

**Task 10.2** — `src/components/layout/DisclaimerModal.tsx`
- Props: `{ isOpen: boolean, onAcknowledge: () => void }`
- Modal with `role="dialog"`, `aria-modal="true"`, `aria-labelledby="disclaimer-title"`
- Focus trap while open
- Privacy notice text + "I Understand" button
- Blocks document upload until acknowledged

**Task 10.3** — `src/components/layout/AppHeader.tsx`
- Props: `{ onAccessibilityToggle: () => void, isAccessibilityMode: boolean }`
- LexAI logo/name
- "Find a Lawyer" link → `https://www.avvo.com/find-a-lawyer`
- Accessibility toggle button

**Task 10.4** — `src/components/layout/AppFooter.tsx`
- Persistent disclaimer banner: "LexAI provides legal information only, not legal advice. Always consult a licensed attorney for advice specific to your situation."
- "Find a Lawyer" link

**Task 10.5** — `src/components/shared/StreamingText.tsx`
- Props: `{ content: string, isStreaming: boolean, ariaLiveMode?: 'polite' | 'assertive' }`
- Renders content with cursor animation while streaming
- `aria-live={ariaLiveMode ?? 'polite'}`, `aria-atomic="false"`

**Task 10.6** — Create these 5 files in `src/components/shared/`:
- `LoadingSkeleton.tsx` — animated pulse skeleton, `lines` prop
- `ErrorBanner.tsx` — error message + optional RetryButton
- `RetryButton.tsx` — accessible retry button
- `DisclaimerBadge.tsx` — small inline disclaimer notice
- `AccessibilityToggle.tsx` — toggle button, syncs to `useAccessibility()`

**Task 10.7** — `src/components/shared/ExportButton.tsx`
- Props: `{ label, formats: ('pdf'|'txt'|'png')[], onExport, isDisabled? }`
- Dropdown or button group for format selection
- Loading state during export, keyboard accessible

**Task 10.8** — `src/hooks/useStreamingResponse.ts`
- `useStreamingResponse<T>()` — returns `{ streamedData, isStreaming, error, trigger, retry }`
- `trigger(url: string, body: object)` — calls fetch with SSE, parses `data:` events as JSON
- Exponential backoff retry on 5xx: 500ms → 1s → 2s (max 3 attempts)
- Uses `deduplicateRequest` from requestDeduplicator
- Sets loading state within 200ms (synchronous before fetch)

**Task 10.9** — `src/components/tabs/FeatureTabs.tsx`
- 8 tabs: summary, risk-graph, comparison, clauses, qa, checklist, next-steps, attorney-pack
- `role="tablist"`, `role="tab"`, `aria-selected`
- Arrow key navigation
- Wired to Zustand `activeTab`

---

### PHASE 6 — Document Upload & Viewer (Tasks 11.1–11.3)

**Task 11.1** — `src/components/document/DocumentUpload.tsx`
- Props: `{ onDocumentParsed, onError, slot: 0|1, isDisabled? }`
- Drag-and-drop zone + file input button
- On file drop/select: run validators → parse → store in Zustand → chunk document
- Show ErrorBanner for format/size/count errors
- Disabled when `disclaimerAcknowledged === false`
- Accessible: `aria-label`, keyboard operable, visible focus

**Task 11.2** — `src/components/document/DocumentMeta.tsx`
- Props: `{ document: ParsedDocument }`
- Shows: name, word count, page count (PDF only)
- Renders nothing until ParsedDocument is available

**Task 11.3** — `src/components/document/DocumentViewer.tsx`
- Props: `{ document, highlightedClauses, onClauseClick, syncScrollRef? }`
- Renders document text with ClauseHighlighter overlaid
- syncScrollRef for comparison sync scrolling

---

### PHASE 7 — Feature Panels (Tasks 12–17)

**Task 12.1** — `src/components/summary/SummaryPanel.tsx`
- Check sessionStorage cache on mount (`lexai_summary_${documentId}`)
- If miss: POST to `/api/summarize`, stream sections
- Show LoadingSkeleton within 200ms
- Render SummarySection components as they arrive
- Append DisclaimerBadge after last section
- ExportButton (pdf, txt) after stream completes
- ErrorBanner + RetryButton on failure (no re-upload needed)

**Task 12.2** — `src/components/summary/SummarySection.tsx`
- Props: `{ title: string, content: string, isStreaming?: boolean }`
- Renders title + StreamingText for content

**Task 13.1** — `src/components/clauses/ClauseHighlighter.tsx`
- Props: `{ text, clauses, onClauseHover, onClauseFocus }`
- Walk text, wrap clauses in `<mark>` with RISK_COLOR_MAP background
- `data-clause-id`, `role="mark"`, `aria-label` with category + risk level
- WCAG 4.5:1 contrast (colors from RISK_COLOR_MAP — already verified)

**Task 13.2** — `src/components/clauses/ClauseTooltip.tsx`
- Shows on hover/focus: category, one-sentence summary, risk level
- Warning icon if `isUnfair === true`
- `role="tooltip"`, linked via `aria-describedby`

**Task 13.3** — `src/components/clauses/ClauseSidebar.tsx`
- Group clauses by category, show count badges
- Click → `onClauseSelect(clauseId)`, `aria-current="true"` on active

**Task 13.4** — `src/components/clauses/ClauseRiskHeader.tsx`
- Total counts by risk level (critical/moderate/low) — text + color both

**Task 14.1** — `src/components/qa/QAChat.tsx`
- Input field + submit button
- Client-side injection check before sending
- POST to `/api/qa` with top-k chunks from `retrieveTopChunks`
- Stream answer token by token, store in `qaHistory`

**Task 14.2** — `src/components/qa/QAMessage.tsx`
- User message: plain text
- Assistant message: StreamingText while streaming, ConfidenceScore after done
- Suppress ConfidenceScore if error event received

**Task 14.3** — `src/components/qa/ConfidenceScore.tsx`
- Props: `{ score: number, citation: string | null }`
- Score badge + citation text
- If `score < 60`: show low-confidence notice

**Task 15.1** — `src/components/checklist/ChecklistItem.tsx`
- Checkbox input with label via `htmlFor`/`id`
- Shows clauseRef when present

**Task 15.2** — `src/components/checklist/ChecklistPanel.tsx`
- Trigger `/api/checklist` on mount
- Render 4 headings in order
- Wire toggles to `toggleChecklistItem` in Zustand
- ExportButton → PDF preserving check states
- Copy to Clipboard → must resolve < 500ms

**Task 16** — `src/components/next-steps/NextStepsPanel.tsx`
- Trigger `/api/next-steps`
- Stream steps, render category badges and clock icons
- Show deadline dates when present
- DisclaimerBadge + ExportButton (combined PDF)

**Task 17** — `src/components/attorney/AttorneyPackPanel.tsx`
- "Prepare for My Attorney" button (disabled until doc processed)
- Trigger `/api/attorney-pack`
- Stream questions grouped under 4 headings
- DisclaimerBadge + ExportButton (pdf + txt)

---

### PHASE 8 — Main Page Wiring (Task 18)

**Task 18** — `app/page.tsx` (replace scaffolded)
- Wire everything together: DocumentUpload (slots 0 and 1), FeatureTabs, all feature panels
- Comparison mode: show when 2 documents loaded
- Single doc mode: show summary → clauses → Q&A → checklist → next steps → attorney pack
- All feature panels receive correct props from Zustand store

---

### PHASE 9 — Risk DNA Graph (Tasks 19.1–19.7)

**Task 19.1** — `src/components/graph/RiskDNAGraphInner.tsx` (dynamically imported, no SSR)
- Import ReactFlow, dagre
- dagre layout: direction LR (comparison) or TB (single doc), node size 180x60
- `panOnDrag`, `zoomOnScroll`, zoom controls
- Wire `onNodeClick`

**Task 19.2** — `src/components/graph/ClauseNode.tsx` (React Flow custom node)
- Background from `RISK_COLOR_MAP[riskLevel]`
- Title + truncated shortText
- `aria-label` with title + risk level
- `tabIndex={0}`, Enter/Space triggers onNodeClick

**Task 19.3** — `src/components/graph/ConflictEdge.tsx` (React Flow custom edge)
- Conflict edges render in `#7C3AED` (purple)
- Default edges render in neutral color

**Task 19.4** — `src/components/graph/GraphLegend.tsx`
- Color legend: red=critical, amber=moderate, green=low, purple=conflict
- Purple only shown when `showComparisonColors` is true
- Each entry has color swatch + text label
- Visible without scrolling at 1280×720px

**Task 19.5** — `src/components/graph/GraphAccessibilityTable.tsx`
- `<table>` with `aria-label="Risk DNA Graph Data"`
- Lists all nodes (title, risk level) and edges (source → target, type)
- Shown when `isAccessibilityMode` is true

**Task 19.6** — `src/components/graph/RiskDNAGraph.tsx` (lazy-loaded wrapper)
```typescript
const RiskDNAGraphInner = dynamic(() => import('./RiskDNAGraphInner'), {
  loading: () => <LoadingSkeleton lines={8} />,
  ssr: false,
});
```
- Show GraphAccessibilityTable when accessibility mode on
- `onExportPng`: html2canvas on graph container ref, download link
- Show GraphLegend

**Task 19.7** — Wire RiskDNAGraph to `/api/risk-graph`
- POST on tab activation, cache result in sessionStorage
- Node click → side panel with full clause text, plain summary, risk level, risk reason

---

### PHASE 10 — Comparison View (Tasks 20.1–20.3)

**Task 20.1** — `src/components/comparison/ComparisonPane.tsx`
- Scrollable div with `ref={scrollRef}`
- Yellow bg for "missing" clauses, label "Missing in [Document Name]"
- Red bg for "conflict" clauses with tooltip showing conflict summary

**Task 20.2** — `src/components/comparison/ComparisonSummaryPanel.tsx`
- Shows total counts for differences, conflicts, missing
- Navigable list — click item scrolls to that clause in the pane

**Task 20.3** — `src/components/comparison/ComparisonView.tsx`
- Two ComparisonPane components side-by-side
- Synchronized scroll: shared onScroll handler mirrors scrollTop
- Trigger `/api/compare` when 2 docs loaded AND both risk graphs exist
- If risk graphs missing: show guidance message
- Stream findings progressively
- ExportButton (pdf) after `done` event

---

### PHASE 11 — Export Layer (Tasks 21.1–21.2)

**Task 21.1** — `src/lib/export/pdfExporter.ts`
- `exportToPdf(content: string | HTMLElement, filename: string): Promise<void>`
- Use jsPDF: text input → jsPDF text, HTML input → html2canvas → jsPDF addImage
- Preserve checkbox state from Zustand when exporting checklist

**Task 21.2** — `src/lib/export/clipboardExporter.ts`
- `copyToClipboard(text: string): Promise<void>`
- `navigator.clipboard.writeText()` with fallback to `document.execCommand('copy')`
- Must complete < 500ms

---

### PHASE 12 — Accessibility Hardening (Tasks 22.1–22.5)

**Task 22.1** — Audit all interactive elements
- Every button, link, input, tab, graph node: `tabIndex`, keyboard event handlers
- Focus indicators: 3:1 contrast ratio minimum

**Task 22.2** — Add ARIA attributes
- `aria-label` on graph nodes, icons, status indicators
- `alt` on all `<img>`
- `aria-live="polite"` in root layout
- All form inputs have `<label htmlFor="id">`

**Task 22.3** — Accessibility Mode visual changes
- `isAccessibilityMode` → `document.body.classList.add('accessibility-mode')` + `fontSize: 18px`
- Add CSS in globals.css: `.accessibility-mode { filter: contrast(1.5); font-size: 18px !important; }`
- Show GraphAccessibilityTable

**Task 22.4** — Privacy notice on first load
- In DisclaimerModal, before "I Understand" button: "Your documents are processed in this browser session only. They are never stored on our servers. Only extracted text (not your files) is sent to the AI model."

**Task 22.5** — Startup env validation
- In `app/layout.tsx` or a `lib/config.ts`: check `process.env.GEMINI_API_KEY`
- If missing in production: `throw new Error('Missing required environment variable: GEMINI_API_KEY')`

---

### PHASE 13 — Tests (Tasks 24.1–25.10)

**Task 24.1** — Unit tests for `src/lib/document/`
- `__tests__/unit/document/documentValidator.test.ts` — valid/invalid type, size boundary (exactly 10MB, 10MB+1byte), count limit
- `__tests__/unit/document/pdfParser.test.ts` — mock pdfjs-dist, verify ParsedDocument fields
- `__tests__/unit/document/docxParser.test.ts` — mock mammoth
- `__tests__/unit/document/txtParser.test.ts` — mock FileReader

**Task 24.2** — Unit tests for `src/lib/ai/`
- `ragChunker.test.ts` — empty string, single sentence, 50k chars, unicode
- `ragRetriever.test.ts` — top-K ordering, empty query, no matching chunks
- `summaryPrompt.test.ts` — disclaimer phrase present
- `qaPrompt.test.ts` — chunk texts injected into prompt

**Task 24.3** — Unit tests for `src/lib/security/`
- `piiRedactor.test.ts` — each pattern in isolation, compound text
- `injectionGuard.test.ts` — each pattern, benign legal text = safe
- `rateLimiter.test.ts` — under limit, at limit, over limit, window expiration

**Task 24.4** — Unit tests for `src/lib/export/` and `src/lib/utils/`
- `tokenCounter.test.ts`
- `colorUtils.test.ts` — all RISK_COLOR_MAP pairs ≥ 4.5:1 contrast
- `requestDeduplicator.test.ts`
- `clipboardExporter.test.ts` — mock navigator.clipboard

**Tasks 25.1–25.10** — Property-based tests (fast-check)

Create these 10 files in `__tests__/property/`:

Each file uses `import { fc } from 'fast-check';` and `test()` from vitest.

- `fileValidation.property.test.ts` — Property 1 (type validation), Property 2 (word count)
- `ragChunker.property.test.ts` — Property 3 (every chunk ≤ 2000 tokens, no content dropped)
- `summaryOutput.property.test.ts` — Property 4 (disclaimer present), Property 5 (sections non-empty), Property 20 (all outputs have disclaimer)
- `riskGraph.property.test.ts` — Property 6 (color invariant), Property 7 (N clauses = N nodes)
- `clauseHighlighter.property.test.ts` — Property 8 (category set), Property 9 (sidebar counts), Property 21 (WCAG contrast)
- `qaOutput.property.test.ts` — Property 10 (chunks in prompt), Property 11 (confidence event)
- `security.property.test.ts` — Property 12 (injection detection), Property 13 (PII removed)
- `nextSteps.property.test.ts` — Property 14 (3-7 steps), Property 15 (attorney step + disclaimer), Property 16 (valid categories)
- `checklist.property.test.ts` — Property 17 (4 headings), Property 18 (clause refs)
- `attorneyPack.property.test.ts` — Property 19 (8-15 questions)

---

### PHASE 14 — Deployment Prep (Tasks 27.1–27.5)

**Task 27.1** — `next.config.mjs` (update existing)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias['pdfjs-dist'] = 'pdfjs-dist/legacy/build/pdf';
    return config;
  },
};
export default nextConfig;
```

**Task 27.2** — `vercel.json`
```json
{
  "functions": {
    "app/api/summarize/route.ts": { "maxDuration": 30 },
    "app/api/risk-graph/route.ts": { "maxDuration": 30 },
    "app/api/compare/route.ts": { "maxDuration": 30 },
    "app/api/qa/route.ts": { "maxDuration": 30 },
    "app/api/checklist/route.ts": { "maxDuration": 30 },
    "app/api/next-steps/route.ts": { "maxDuration": 30 },
    "app/api/attorney-pack/route.ts": { "maxDuration": 30 }
  }
}
```

**Task 27.3** — `README.md`
Include: project overview, all 7 use cases, GenAI architecture (which Gemini model used where), setup instructions, env vars, test commands, live deployment link, GitHub link.

**Task 27.4** — `LICENSE` file (MIT)
```
MIT License

Copyright (c) 2026 Vansh Dobariya

Permission is hereby granted, free of charge, to any person obtaining a copy of this software...
```

**Task 27.5** — Verify repo size
- Run `git ls-files | xargs du -sh` to check total
- Ensure `.gitignore` has: `.next/`, `node_modules/`, `.env.local`, `coverage/`
- Repo must be < 10 MB

---

## 6. Environment Variables Required

Create `.env.local` with:
```
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The `.env.example` file already exists with placeholder values.

**Get Gemini API key:** https://aistudio.google.com/app/apikey (free tier available)

---

## 7. Key Decisions & Constraints

1. **No database.** Zero server-side storage. Documents live only in Zustand (in-memory) + sessionStorage (client cache for AI outputs). Zustand clears on page reload.

2. **PII redaction always happens server-side** before any Gemini call. Never transmit raw names/emails/SSNs to the API.

3. **Gemini API key** must NEVER appear in client-side code. All AI calls go through Next.js API routes.

4. **React Flow** must be lazy-loaded via `next/dynamic` with `ssr: false`. Do not import it at the top level of any page.

5. **All utility functions** use named exports (not default). This is required for tree-shaking and test coverage.

6. **TypeScript strict mode** — zero `any` types, zero `ts-ignore` comments, zero compilation errors.

7. **All AI outputs** must include a disclaimer. This is tested by Property 20.

8. **RAG chunking** happens client-side before the API call. The chunks (not the full document) go to the QA endpoint.

9. **Session storage cache**: immediately write summaries and graphs to sessionStorage after generation. Check cache before triggering API calls.

10. **Streaming**: all Gemini responses stream token-by-token via SSE. The frontend uses SSE `data:` events, not regular JSON responses.

---

## 8. Testing Commands

```bash
npm run typecheck       # tsc --noEmit (must pass with 0 errors)
npm run lint           # ESLint
npm run test:unit      # Vitest unit suite
npm run test:property  # Vitest property-based suite
npm run test:coverage  # Coverage report (must be ≥80% on src/lib/)
npm run dev            # Local development server
npm run build          # Production build (must succeed)
```

---

## 9. Completion Checklist

Before considering this done, verify ALL of the following:

- [ ] `npm run typecheck` → 0 errors
- [ ] `npm run build` → builds successfully  
- [ ] `npm run test:coverage` → ≥80% on `src/lib/`
- [ ] App runs locally: upload a PDF, get a summary, see Risk DNA Graph, ask a Q&A question
- [ ] Two-document comparison works
- [ ] All 3 export formats work (PDF, TXT, PNG for graph)
- [ ] Disclaimer modal shows on first load, blocks upload until acknowledged
- [ ] Accessibility mode toggles correctly (font size 18px, high contrast)
- [ ] No API key visible in browser network tab or client bundle
- [ ] Repository is public on GitHub
- [ ] Repository is < 10 MB (`git ls-files | wc -c`)
- [ ] Deployed to Vercel with live URL working
- [ ] README has live URL and all setup instructions
- [ ] MIT LICENSE file exists

---

## 10. The Goal

This project must score **100/100** across all 6 evaluation criteria when assessed by the Google GDG HackToSkill AI evaluator. The criteria are:

1. **Code Quality** — TypeScript strict, clean layers, JSDoc, named exports, no inline prompts
2. **Security** — No storage, PII redaction, API key server-only, rate limiting, CSP, injection guard
3. **Accessibility** — WCAG 2.1 AA, keyboard nav, ARIA, 200% zoom, accessibility mode
4. **Efficiency** — Lighthouse 85+, <3s TTFT, session cache, lazy loading, deduplication
5. **Testing** — 80%+ coverage, unit tests + 10 property-based test files (21 properties)
6. **Problem Statement Alignment** — all 7 legal AI use cases covered, responsible AI disclaimers throughout

**Do not stop until all tasks are complete, all tests pass, and the app is deployed.**

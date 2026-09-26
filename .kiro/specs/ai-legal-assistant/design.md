# LexAI — Technical Design Document

## Overview

LexAI is a Next.js 14 (App Router) web application that provides AI-powered legal document analysis entirely within a browser session. All document parsing runs client-side; only extracted plain text is forwarded to the Gemini API via secure server-side API routes. The application differentiates itself through the **Legal Risk DNA Graph** — an interactive SVG/canvas visualization of clause relationships and risk levels built with React Flow (lazy-loaded).

### Design Principles

1. **Session-only data** — no document text, AI output, or PII is persisted to any database or logging service.
2. **Streaming-first UI** — all Gemini responses are delivered token-by-token via Server-Sent Events (SSE).
3. **Security by default** — API keys are server-side only, PII is redacted before every API call, rate limiting is applied at the route layer.
4. **Accessibility-first** — WCAG 2.1 AA compliance is a hard constraint, not a nice-to-have.
5. **Performance budget** — Lighthouse 85+ desktop / 75+ mobile; <3 s TTFT; graph library lazy-loaded.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│                                                                 │
│  ┌──────────────┐   ┌──────────────────────────────────────┐   │
│  │  File Input  │──▶│   Document Processing Pipeline       │   │
│  │ (PDF/DOCX/   │   │  pdf.js / mammoth.js (client-side)   │   │
│  │    TXT)      │   │  → plain text + metadata             │   │
│  └──────────────┘   └──────────────┬─────────────────────-─┘   │
│                                    │ plain text only            │
│  ┌─────────────────────────────────▼──────────────────────┐    │
│  │              React UI Layer (Next.js App Router)        │    │
│  │  DocumentUpload │ SummaryPanel │ RiskDNAGraph           │    │
│  │  ComparisonView │ ClausePanel  │ QAChat                 │    │
│  │  ChecklistPanel │ NextSteps    │ AttorneyPack            │    │
│  └─────────────────────────────────┬───────────────────────┘   │
│                                    │ fetch / SSE               │
└────────────────────────────────────┼──────────────────────────-┘
                                     │ HTTPS only
┌────────────────────────────────────▼───────────────────────────┐
│                    Next.js API Routes (Server)                  │
│                                                                 │
│  /api/summarize    /api/risk-graph    /api/compare              │
│  /api/qa           /api/checklist     /api/next-steps           │
│  /api/attorney-pack                                             │
│                                                                 │
│  Middleware: RateLimiter │ PiiRedactor │ InjectionGuard         │
│  CSP Headers │ HTTPS enforcement                               │
└────────────────────────────────────┬───────────────────────────┘
                                     │ Gemini API SDK
┌────────────────────────────────────▼───────────────────────────┐
│                         Google Gemini API                       │
│  gemini-1.5-flash (summary, Q&A, checklist, next steps)        │
│  gemini-1.5-pro   (risk graph analysis, comparison)            │
└─────────────────────────────────────────────────────────────────┘
```

### Client vs Server Boundary

| Concern | Location | Rationale |
|---|---|---|
| PDF parsing (pdf.js) | Client | Raw file bytes never leave the browser |
| DOCX parsing (mammoth.js) | Client | Same — session-only guarantee |
| TXT reading (FileReader API) | Client | Trivial; no library needed |
| Text chunking for RAG | Client | Reduces server payload; enables local caching |
| Gemini API key | Server (env var) | Never exposed to client bundle |
| Gemini API calls | Server (API routes) | Key protection + rate limiting |
| PII redaction | Server (before Gemini call) | Defense-in-depth; server controls what reaches AI |
| Rate limiting | Server (middleware) | Cannot be bypassed by client |
| sessionStorage cache | Client | Session-only; clears on tab close |

### Next.js App Router Directory Structure

```
app/
├── layout.tsx                  # Root layout with DisclaimerModal + Footer
├── page.tsx                    # Landing / main app page
├── globals.css                 # Tailwind base + CSS custom properties
├── api/
│   ├── summarize/route.ts      # POST → SSE stream
│   ├── risk-graph/route.ts     # POST → JSON (graph nodes/edges)
│   ├── compare/route.ts        # POST → SSE stream
│   ├── qa/route.ts             # POST → SSE stream
│   ├── checklist/route.ts      # POST → SSE stream
│   ├── next-steps/route.ts     # POST → SSE stream
│   └── attorney-pack/route.ts  # POST → SSE stream
└── (pages if needed)/
    └── ...

src/
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── AppFooter.tsx
│   │   └── DisclaimerModal.tsx
│   ├── document/
│   │   ├── DocumentUpload.tsx
│   │   ├── DocumentMeta.tsx
│   │   └── DocumentViewer.tsx
│   ├── summary/
│   │   ├── SummaryPanel.tsx
│   │   └── SummarySection.tsx
│   ├── graph/
│   │   ├── RiskDNAGraph.tsx        # Lazy-loaded wrapper
│   │   ├── RiskDNAGraphInner.tsx   # React Flow implementation
│   │   ├── ClauseNode.tsx          # Custom node renderer
│   │   ├── ConflictEdge.tsx        # Custom edge renderer
│   │   ├── GraphLegend.tsx
│   │   └── GraphAccessibilityTable.tsx
│   ├── comparison/
│   │   ├── ComparisonView.tsx
│   │   ├── ComparisonPane.tsx
│   │   └── ComparisonSummaryPanel.tsx
│   ├── clauses/
│   │   ├── ClauseHighlighter.tsx
│   │   ├── ClauseSidebar.tsx
│   │   ├── ClauseTooltip.tsx
│   │   └── ClauseRiskHeader.tsx
│   ├── qa/
│   │   ├── QAChat.tsx
│   │   ├── QAMessage.tsx
│   │   └── ConfidenceScore.tsx
│   ├── checklist/
│   │   ├── ChecklistPanel.tsx
│   │   └── ChecklistItem.tsx
│   ├── next-steps/
│   │   └── NextStepsPanel.tsx
│   ├── attorney/
│   │   └── AttorneyPackPanel.tsx
│   ├── shared/
│   │   ├── StreamingText.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── ErrorBanner.tsx
│   │   ├── RetryButton.tsx
│   │   ├── ExportButton.tsx
│   │   ├── DisclaimerBadge.tsx
│   │   └── AccessibilityToggle.tsx
│   └── tabs/
│       └── FeatureTabs.tsx
├── hooks/
│   ├── useDocumentStore.ts     # Zustand store hook
│   ├── useStreamingResponse.ts # SSE consumer hook
│   ├── useSessionCache.ts      # sessionStorage read/write
│   └── useAccessibility.ts    # Accessibility mode state
├── lib/
│   ├── ai/
│   │   ├── geminiClient.ts         # Gemini SDK init (server-only)
│   │   ├── streamHandler.ts        # SSE response builder
│   │   ├── ragChunker.ts           # Text → chunks (client)
│   │   ├── ragRetriever.ts         # Chunk ranking/retrieval (client)
│   │   └── prompts/
│   │       ├── index.ts            # Versioned prompt exports
│   │       ├── summaryPrompt.ts    # v1
│   │       ├── riskGraphPrompt.ts  # v1
│   │       ├── comparisonPrompt.ts # v1
│   │       ├── qaPrompt.ts         # v1
│   │       ├── checklistPrompt.ts  # v1
│   │       ├── nextStepsPrompt.ts  # v1
│   │       └── attorneyPackPrompt.ts # v1
│   ├── document/
│   │   ├── pdfParser.ts        # pdf.js wrapper (client-side)
│   │   ├── docxParser.ts       # mammoth.js wrapper (client-side)
│   │   ├── txtParser.ts        # FileReader wrapper (client-side)
│   │   └── documentValidator.ts # Size/type validation
│   ├── security/
│   │   ├── piiRedactor.ts      # Regex-based PII replacement
│   │   ├── injectionGuard.ts   # Prompt injection detection
│   │   ├── rateLimiter.ts      # In-memory / Upstash rate limit
│   │   └── cspConfig.ts        # CSP header builder
│   ├── export/
│   │   ├── pdfExporter.ts      # jsPDF wrapper
│   │   └── clipboardExporter.ts
│   └── utils/
│       ├── tokenCounter.ts     # Approximate token counting
│       ├── requestDeduplicator.ts
│       └── colorUtils.ts       # Contrast ratio calculation
├── store/
│   └── documentStore.ts        # Zustand store definition
├── types/
│   ├── document.ts
│   ├── graph.ts
│   ├── ai.ts
│   ├── checklist.ts
│   └── common.ts
└── middleware.ts                # Next.js middleware for CSP + rate limit
```

---

## Components and Interfaces

### Layout Components

#### `AppHeader`
```typescript
interface AppHeaderProps {
  onAccessibilityToggle: () => void;
  isAccessibilityMode: boolean;
}
```

#### `AppFooter`
```typescript
// No props — renders static disclaimer banner + Find a Lawyer link
interface AppFooterProps {}
```

#### `DisclaimerModal`
```typescript
interface DisclaimerModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
}
```

### Document Components

#### `DocumentUpload`
```typescript
interface DocumentUploadProps {
  onDocumentParsed: (doc: ParsedDocument, slot: 0 | 1) => void;
  onError: (error: DocumentError) => void;
  slot: 0 | 1;
  isDisabled?: boolean;
}
```

#### `DocumentMeta`
```typescript
interface DocumentMetaProps {
  document: ParsedDocument;
}
```

#### `DocumentViewer`
```typescript
interface DocumentViewerProps {
  document: ParsedDocument;
  highlightedClauses: HighlightedClause[];
  onClauseClick: (clauseId: string) => void;
  syncScrollRef?: React.RefObject<HTMLDivElement>; // for comparison sync
}
```

### Summary Components

#### `SummaryPanel`
```typescript
interface SummaryPanelProps {
  documentId: string;
  documentText: string;
  onSummaryComplete: (summary: SummaryResult) => void;
}
```

#### `SummarySection`
```typescript
interface SummarySectionProps {
  title: string;
  content: string;
  isStreaming?: boolean;
}
```

### Graph Components

#### `RiskDNAGraph` (lazy-loaded wrapper)
```typescript
interface RiskDNAGraphProps {
  graphData: RiskGraphData | null;
  isLoading: boolean;
  isAccessibilityMode: boolean;
  onNodeClick: (nodeId: string) => void;
  onExportPng: () => void;
}
```

#### `RiskDNAGraphInner` (React Flow implementation, loaded dynamically)
```typescript
interface RiskDNAGraphInnerProps {
  nodes: RiskNode[];
  edges: RiskEdge[];
  onNodeClick: (nodeId: string) => void;
  exportRef: React.RefObject<HTMLDivElement>;
}
```

#### `ClauseNode` (React Flow custom node)
```typescript
interface ClauseNodeData {
  clauseId: string;
  title: string;
  riskLevel: RiskLevel;
  isComparison?: boolean;
  documentIndex?: 0 | 1;
}
```

#### `GraphLegend`
```typescript
interface GraphLegendProps {
  showComparisonColors: boolean; // shows purple when true
}
```

#### `GraphAccessibilityTable`
```typescript
interface GraphAccessibilityTableProps {
  nodes: RiskNode[];
  edges: RiskEdge[];
}
```

### Comparison Components

#### `ComparisonView`
```typescript
interface ComparisonViewProps {
  documents: [ParsedDocument, ParsedDocument];
  comparisonResult: ComparisonResult | null;
  isLoading: boolean;
}
```

#### `ComparisonPane`
```typescript
interface ComparisonPaneProps {
  document: ParsedDocument;
  highlights: ComparisonHighlight[];
  scrollRef: React.RefObject<HTMLDivElement>;
  label: string;
}
```

### Clause Components

#### `ClauseHighlighter`
```typescript
interface ClauseHighlighterProps {
  text: string;
  clauses: HighlightedClause[];
  onClauseHover: (clauseId: string | null) => void;
  onClauseFocus: (clauseId: string | null) => void;
}
```

#### `ClauseSidebar`
```typescript
interface ClauseSidebarProps {
  clauses: HighlightedClause[];
  activeClauseId: string | null;
  onClauseSelect: (clauseId: string) => void;
}
```

### Q&A Components

#### `QAChat`
```typescript
interface QAChatProps {
  documentText: string;
  chunks: TextChunk[];
  conversationHistory: QAMessage[];
  onNewMessage: (message: QAMessage) => void;
}
```

#### `ConfidenceScore`
```typescript
interface ConfidenceScoreProps {
  score: number;  // 0–100
  citation: string | null;
}
```

### Checklist Components

#### `ChecklistPanel`
```typescript
interface ChecklistPanelProps {
  documentId: string;
  checklist: ChecklistData | null;
  onCheckToggle: (itemId: string, checked: boolean) => void;
  onExport: () => void;
  onCopyToClipboard: () => void;
}
```

#### `ChecklistItem`
```typescript
interface ChecklistItemProps {
  item: ChecklistEntry;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}
```

### Shared Components

#### `StreamingText`
```typescript
interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  ariaLiveMode?: 'polite' | 'assertive';
}
```

#### `LoadingSkeleton`
```typescript
interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}
```

#### `ExportButton`
```typescript
interface ExportButtonProps {
  label: string;
  formats: ('pdf' | 'txt' | 'png')[];
  onExport: (format: 'pdf' | 'txt' | 'png') => Promise<void>;
  isDisabled?: boolean;
}
```

---

## API Routes

All routes are located under `app/api/`. All routes return `Content-Type: text/event-stream` for streaming responses or `application/json` for non-streaming. All routes apply the middleware chain: `rateLimiter → validateInput → piiRedact → injectionGuard → handler`.

### `POST /api/summarize`

**Request:**
```typescript
interface SummarizeRequest {
  documentText: string;   // sanitized, PII-redacted text
  documentId: string;     // client-generated UUID for deduplication
}
```

**Response:** SSE stream of `SummaryStreamEvent`
```typescript
type SummaryStreamEvent =
  | { type: 'section'; title: string; content: string }
  | { type: 'disclaimer'; text: string }
  | { type: 'done'; totalSections: number }
  | { type: 'error'; message: string };
```

**Model:** `gemini-1.5-flash`

---

### `POST /api/risk-graph`

**Request:**
```typescript
interface RiskGraphRequest {
  documentText: string;
  documentId: string;
  comparisonDocumentText?: string;  // optional second doc for comparison graph
}
```

**Response:** `application/json`
```typescript
interface RiskGraphResponse {
  nodes: RiskNode[];
  edges: RiskEdge[];
  documentId: string;
}
```

**Model:** `gemini-1.5-pro` (complex structural analysis)

---

### `POST /api/compare`

**Request:**
```typescript
interface CompareRequest {
  documentTextA: string;
  documentTextB: string;
  documentIdA: string;
  documentIdB: string;
}
```

**Response:** SSE stream of `CompareStreamEvent`
```typescript
type CompareStreamEvent =
  | { type: 'difference'; docA: string; docB: string; clauseA: string; clauseB: string }
  | { type: 'conflict'; clauseA: string; clauseB: string; summary: string }
  | { type: 'missing'; clause: string; missingFrom: 'A' | 'B'; documentName: string }
  | { type: 'summary'; totalDifferences: number; totalConflicts: number; totalMissing: number }
  | { type: 'done' }
  | { type: 'error'; message: string };
```

**Model:** `gemini-1.5-pro`

---

### `POST /api/qa`

**Request:**
```typescript
interface QARequest {
  question: string;
  chunks: TextChunk[];         // top-k retrieved chunks
  conversationHistory: QAHistoryItem[];
  documentId: string;
}
```

**Response:** SSE stream of `QAStreamEvent`
```typescript
type QAStreamEvent =
  | { type: 'token'; content: string }
  | { type: 'confidence'; score: number; citation: string | null }
  | { type: 'disclaimer'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };
```

**Model:** `gemini-1.5-flash`

---

### `POST /api/checklist`

**Request:**
```typescript
interface ChecklistRequest {
  documentText: string;
  documentId: string;
}
```

**Response:** SSE stream of `ChecklistStreamEvent`
```typescript
type ChecklistStreamEvent =
  | { type: 'heading'; heading: ChecklistHeading }
  | { type: 'item'; headingKey: string; item: ChecklistEntry }
  | { type: 'done' }
  | { type: 'error'; message: string };
```

**Model:** `gemini-1.5-flash`

---

### `POST /api/next-steps`

**Request:**
```typescript
interface NextStepsRequest {
  documentText: string;
  documentId: string;
  summaryText: string;  // already-generated summary for context
}
```

**Response:** SSE stream of `NextStepsStreamEvent`
```typescript
type NextStepsStreamEvent =
  | { type: 'step'; step: NextStep }
  | { type: 'disclaimer'; text: string }
  | { type: 'done'; totalSteps: number }
  | { type: 'error'; message: string };
```

**Model:** `gemini-1.5-flash`

---

### `POST /api/attorney-pack`

**Request:**
```typescript
interface AttorneyPackRequest {
  documentText: string;
  documentId: string;
  summaryText: string;
  riskGraphData: RiskGraphData;  // pre-generated
}
```

**Response:** SSE stream of `AttorneyPackStreamEvent`
```typescript
type AttorneyPackStreamEvent =
  | { type: 'heading'; heading: AttorneyHeading }
  | { type: 'question'; headingKey: string; question: string }
  | { type: 'disclaimer'; text: string }
  | { type: 'done'; totalQuestions: number }
  | { type: 'error'; message: string };
```

**Model:** `gemini-1.5-flash`

---

## AI Service Layer

### Gemini Client (`lib/ai/geminiClient.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Server-only module — never imported in client components
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const getFlashModel = () => genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
export const getProModel = () => genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
```

### Streaming Handler (`lib/ai/streamHandler.ts`)

```typescript
/**
 * Converts a Gemini streaming response into a Next.js SSE Response.
 * Wraps each chunk in a Server-Sent Events data frame.
 */
export async function buildSSEResponse(
  streamIterable: AsyncIterable<GenerateContentStreamResult>,
  eventTransformer: (chunk: string) => string
): Promise<Response>
```

### RAG Chunker (`lib/ai/ragChunker.ts`)

The chunker runs entirely on the client side, producing fixed-size semantic chunks before any API call.

**Algorithm:**

1. Split text into sentences using a sentence boundary regex: `/(?<=[.!?])\s+(?=[A-Z])/`.
2. Accumulate sentences into a working buffer, tracking token count using `tokenCounter.approximateTokens()`.
3. When the buffer reaches 1,800 tokens (leaving 200-token overlap buffer), emit a chunk.
4. Start the next chunk with the last 2 sentences of the previous chunk for context continuity (sliding window overlap).
5. Tag each chunk with `{ chunkId, startOffset, endOffset, tokenCount, text }`.

```typescript
export interface TextChunk {
  chunkId: string;         // UUID
  startOffset: number;     // character offset in original text
  endOffset: number;
  tokenCount: number;
  text: string;
}

export function chunkDocument(text: string, maxTokens?: number): TextChunk[]
```

### RAG Retriever (`lib/ai/ragRetriever.ts`)

Client-side BM25-style keyword retrieval (no external embedding service needed for hackathon scope):

```typescript
export function retrieveTopChunks(
  query: string,
  chunks: TextChunk[],
  topK?: number          // default: 5
): TextChunk[]
```

Algorithm: tokenize query, score each chunk by term-frequency overlap, return top-K by score descending.

### Prompts Module (`lib/ai/prompts/`)

All prompts are versioned string constants. Each file exports:

```typescript
export const PROMPT_VERSION = 'v1';
export const PROMPT_NAME = 'summary';  // unique identifier
export function buildSummaryPrompt(documentText: string): string;
```

**`summaryPrompt.ts`** — instructs Gemini to produce labeled sections matching document structure, Flesch-Kincaid ≤8, JSON-structured output with a trailing disclaimer.

**`riskGraphPrompt.ts`** — instructs Gemini to return a structured JSON array of clause nodes with `{ clauseId, title, text, riskLevel, riskReason, relatedClauses[] }`.

**`comparisonPrompt.ts`** — structured diff prompt returning conflict/missing/difference events.

**`qaPrompt.ts`** — RAG prompt injecting top-k chunks; instructs model to respond "I cannot find relevant information" for out-of-context questions and to include a confidence score (0–100) and exact clause citation.

**`checklistPrompt.ts`** — generates structured JSON with the 4 required headings.

**`nextStepsPrompt.ts`** — generates 3–7 steps with category tags and deadline extraction.

**`attorneyPackPrompt.ts`** — generates 8–15 document-specific questions grouped by 4 headings.

---

## Document Processing Pipeline

### Client-Side Parsing Architecture

```
User File Input
       │
       ▼
documentValidator.ts  ── validateFileType() ──▶ error if unsupported
       │               ── validateFileSize() ──▶ error if >10MB
       │               ── validateFileCount() ──▶ error if >2 docs
       ▼
Format router:
  .pdf  → pdfParser.ts    (pdf.js: renderPage() → getTextContent())
  .docx → docxParser.ts   (mammoth.js: extractRawText())
  .txt  → txtParser.ts    (FileReader.readAsText())
       │
       ▼
ParsedDocument { id, name, text, wordCount, pageCount? }
       │
       ▼
ragChunker.ts  →  TextChunk[]  (stored in Zustand + sessionStorage)
```

### `documentValidator.ts`

```typescript
export function validateFileType(file: File): ValidationResult;
export function validateFileSize(file: File, maxMb?: number): ValidationResult;
export function validateFileCount(currentCount: number, maxCount?: number): ValidationResult;
```

### `pdfParser.ts`

```typescript
/**
 * Extracts text from a PDF File using pdf.js.
 * Returns extracted text and page count.
 * Resolves within 5 seconds for files ≤10 MB.
 */
export async function parsePdf(file: File): Promise<ParsedDocument>;
```

Implementation: `pdfjsLib.getDocument({ data: arrayBuffer })`, iterate pages, call `page.getTextContent()`, join `TextItem.str` values with spaces, handle `TextMarkedContent` gracefully.

### `docxParser.ts`

```typescript
/**
 * Extracts text from a DOCX File using mammoth.js.
 */
export async function parseDocx(file: File): Promise<ParsedDocument>;
```

### `txtParser.ts`

```typescript
/**
 * Reads plain text from a TXT File using the FileReader API.
 */
export async function parseTxt(file: File): Promise<ParsedDocument>;
```

---

## Risk DNA Graph

### Data Model

```typescript
// types/graph.ts

export type RiskLevel = 'critical' | 'moderate' | 'low';

export interface RiskNode {
  id: string;              // clauseId
  type: 'clauseNode';
  position: { x: number; y: number };  // computed by layout algorithm
  data: ClauseNodeData;
}

export interface ClauseNodeData {
  clauseId: string;
  title: string;
  shortText: string;       // first 120 chars of clause
  fullText: string;
  riskLevel: RiskLevel;
  riskReason: string;
  plainSummary: string;
  documentIndex: 0 | 1;   // which document (0 = single, 0|1 = comparison)
}

export interface RiskEdge {
  id: string;              // `${sourceId}-${targetId}`
  source: string;
  target: string;
  type: 'default' | 'conflict';  // conflict = purple in comparison mode
  label?: string;
  animated?: boolean;
}

export interface RiskGraphData {
  nodes: RiskNode[];
  edges: RiskEdge[];
  documentId: string;
  generatedAt: number;     // Date.now()
}
```

### Layout Algorithm

Uses React Flow's built-in `dagre` layout integration:

1. Build a `dagre.graphlib.Graph` from `RiskNode[]` and `RiskEdge[]`.
2. Configure graph direction: `LR` (left-to-right) for comparison mode, `TB` (top-to-bottom) for single document.
3. Set node size: `{ width: 180, height: 60 }`.
4. Run `dagre.layout(graph)`.
5. Map computed `{ x, y }` positions back to React Flow node `position` property.

### Color Mapping

```typescript
// lib/utils/colorUtils.ts
export const RISK_COLOR_MAP: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  critical: { bg: '#FEE2E2', text: '#7F1D1D', border: '#EF4444' },   // red-100 / red-900 / red-500
  moderate: { bg: '#FEF3C7', text: '#78350F', border: '#F59E0B' },   // amber-100 / amber-900 / amber-500
  low:      { bg: '#D1FAE5', text: '#064E3B', border: '#10B981' },   // green-100 / green-900 / green-500
};
export const CONFLICT_EDGE_COLOR = '#7C3AED';  // violet-700 — purple conflict edges
```

All color pairs satisfy WCAG 2.1 AA (≥4.5:1 contrast ratio), verified by `colorUtils.getContrastRatio()`.

### Interaction Handlers

- **Node click**: `onNodeClick(nodeId)` → dispatches to Zustand store → `ClauseDetailPanel` renders.
- **Pan**: Built into React Flow via `panOnDrag`.
- **Zoom**: Built into React Flow via `zoomOnScroll` + zoom controls component.
- **Export PNG**: `html2canvas` on the graph container ref → creates download link.

---

## State Management

Zustand is used for global session state. No persistence middleware — everything is in-memory, cleared on page reload.

### Store Definition (`store/documentStore.ts`)

```typescript
interface DocumentStore {
  // Document slots
  documents: [ParsedDocument | null, ParsedDocument | null];
  setDocument: (slot: 0 | 1, doc: ParsedDocument) => void;
  clearDocument: (slot: 0 | 1) => void;

  // Chunks (for RAG)
  chunks: [TextChunk[], TextChunk[]];
  setChunks: (slot: 0 | 1, chunks: TextChunk[]) => void;

  // AI-generated outputs
  summaries: [SummaryResult | null, SummaryResult | null];
  setSummary: (slot: 0 | 1, summary: SummaryResult) => void;

  riskGraphs: [RiskGraphData | null, RiskGraphData | null];
  setRiskGraph: (slot: 0 | 1, graph: RiskGraphData) => void;

  comparisonResult: ComparisonResult | null;
  setComparisonResult: (result: ComparisonResult) => void;

  highlightedClauses: [HighlightedClause[], HighlightedClause[]];
  setHighlightedClauses: (slot: 0 | 1, clauses: HighlightedClause[]) => void;

  qaHistory: QAMessage[];
  addQAMessage: (message: QAMessage) => void;

  checklist: [ChecklistData | null, ChecklistData | null];
  setChecklist: (slot: 0 | 1, data: ChecklistData) => void;
  toggleChecklistItem: (slot: 0 | 1, itemId: string) => void;

  nextSteps: NextStep[] | null;
  setNextSteps: (steps: NextStep[]) => void;

  attorneyPack: AttorneyPackData | null;
  setAttorneyPack: (data: AttorneyPackData) => void;

  // UI state
  activeTab: FeatureTab;
  setActiveTab: (tab: FeatureTab) => void;
  isAccessibilityMode: boolean;
  toggleAccessibilityMode: () => void;
  disclaimerAcknowledged: boolean;
  acknowledgeDisclaimer: () => void;

  // Reset
  clearAll: () => void;
}
```

### Session Cache Hook (`hooks/useSessionCache.ts`)

Wraps sessionStorage for AI outputs (summaries and graphs are cached immediately upon generation per Req 12.5):

```typescript
export function useSessionCache<T>(key: string): {
  get: () => T | null;
  set: (value: T) => void;
  clear: () => void;
}
```

Cache keys: `lexai_summary_${documentId}`, `lexai_graph_${documentId}`.

---

## Security Implementation

### PII Redactor (`lib/security/piiRedactor.ts`)

```typescript
export interface RedactionResult {
  redactedText: string;
  redactionCount: number;
  redactionMap: Map<string, string>;  // placeholder → original (for display only, never sent to AI)
}

export function redactPii(text: string): RedactionResult;
```

**Regex patterns applied in order:**

```typescript
const PII_PATTERNS: Array<{ pattern: RegExp; placeholder: string }> = [
  // Social Security Numbers
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, placeholder: '[SSN]' },
  // US Phone numbers
  { pattern: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g, placeholder: '[PHONE]' },
  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, placeholder: '[EMAIL]' },
  // US street addresses (heuristic)
  { pattern: /\b\d{1,5}\s[\w\s]{1,30}(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)\b/gi, placeholder: '[ADDRESS]' },
  // US ZIP codes
  { pattern: /\b\d{5}(?:-\d{4})?\b/g, placeholder: '[ZIP]' },
  // Passport / ID numbers (generic alphanumeric 6-12 chars preceded by "passport", "ID", "license")
  { pattern: /\b(?:passport|license|id)\s*(?:no\.?|number|#)?\s*:?\s*([A-Z0-9]{6,12})\b/gi, placeholder: '[ID_NUMBER]' },
  // Proper names (heuristic: two Title-Case words in sequence, not at sentence start)
  { pattern: /(?<![.!?]\s)\b([A-Z][a-z]+)\s([A-Z][a-z]+)\b/g, placeholder: '[PERSON_NAME]' },
];
```

### Injection Guard (`lib/security/injectionGuard.ts`)

```typescript
export interface InjectionCheckResult {
  isSafe: boolean;
  detectedPattern?: string;
}

export function checkForInjection(input: string): InjectionCheckResult;
```

**Detection patterns:**

```typescript
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|all|prior)\s+instructions?/gi,
  /you\s+are\s+now\s+(?:a|an)/gi,
  /disregard\s+(your|all|the)\s+(previous|prior|above)/gi,
  /\bsystem\s*prompt\b/gi,
  /\bact\s+as\b.*\b(DAN|jailbreak|uncensored)\b/gi,
  /<\/?(?:script|system|assistant|user)\s*>/gi,
  /\[\s*INST\s*\]/gi,   // LLaMA-style injection
];
```

### Rate Limiter (`lib/security/rateLimiter.ts`)

In-memory implementation using a sliding window counter (suitable for single-instance Vercel deployment; swap for Upstash Redis for multi-instance):

```typescript
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;  // seconds
}

export function checkRateLimit(ip: string, limit?: number, windowMs?: number): RateLimitResult;
// Default: limit=20, windowMs=60_000 (20 req/min/IP)
```

Storage: `Map<string, { count: number; windowStart: number }>` — keyed by IP address.

### CSP Configuration (`lib/security/cspConfig.ts`)

```typescript
export function buildCspHeader(): string;
// Returns:
// default-src 'self';
// script-src 'self' 'nonce-{nonce}';
// style-src 'self' 'unsafe-inline';  // required for Tailwind JIT
// img-src 'self' data: blob:;         // blob: for PNG export
// connect-src 'self' https://generativelanguage.googleapis.com;
// font-src 'self';
// object-src 'none';
// frame-ancestors 'none';
```

CSP nonce is generated per-request in `middleware.ts` and injected via `next/headers`.

---

## Performance

### Request Deduplication (`lib/utils/requestDeduplicator.ts`)

```typescript
const pendingRequests = new Map<string, Promise<Response>>();

export function deduplicateRequest(
  key: string,
  requestFn: () => Promise<Response>,
  windowMs?: number   // default: 500
): Promise<Response>;
```

Algorithm: if a request with the same `key` is already pending (within `windowMs`), return the existing Promise. Otherwise, create a new one, store it, and remove it after resolution.

Deduplication key: `${route}_${documentId}` — constructed at the call site before the fetch.

### Session Storage Cache

- On summary generation complete: `sessionStorage.setItem('lexai_summary_${id}', JSON.stringify(result))`.
- On graph generation complete: `sessionStorage.setItem('lexai_graph_${id}', JSON.stringify(result))`.
- On feature tab load: check cache first before triggering a new API call.

### Lazy Loading

The React Flow graph library is imported via Next.js dynamic import:

```typescript
// components/graph/RiskDNAGraph.tsx
const RiskDNAGraphInner = dynamic(
  () => import('./RiskDNAGraphInner'),
  { loading: () => <LoadingSkeleton lines={8} />, ssr: false }
);
```

### Loading Skeleton

All AI-triggered actions dispatch a `setLoadingState(true)` to the store within 200ms (synchronous), rendering `<LoadingSkeleton />` immediately while the API call is in-flight.

---

## Type Definitions

### `types/document.ts`

```typescript
export interface ParsedDocument {
  id: string;                // UUID
  name: string;
  text: string;
  wordCount: number;
  pageCount?: number;        // PDF only
  format: 'pdf' | 'docx' | 'txt';
  parsedAt: number;          // Date.now()
}

export interface DocumentError {
  code: 'UNSUPPORTED_FORMAT' | 'FILE_TOO_LARGE' | 'TOO_MANY_DOCUMENTS' | 'PARSE_ERROR';
  message: string;
  details?: string;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: DocumentError };
```

### `types/graph.ts`

```typescript
export type RiskLevel = 'critical' | 'moderate' | 'low';

export interface RiskNode { /* as defined in Risk DNA section */ }
export interface ClauseNodeData { /* as defined in Risk DNA section */ }
export interface RiskEdge { /* as defined in Risk DNA section */ }
export interface RiskGraphData { /* as defined in Risk DNA section */ }
```

### `types/ai.ts`

```typescript
export interface SummarySection {
  title: string;
  content: string;
}

export interface SummaryResult {
  documentId: string;
  sections: SummarySection[];
  disclaimer: string;
  generatedAt: number;
}

export interface QAMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidenceScore?: number;
  citation?: string | null;
  isLowConfidence?: boolean;
  timestamp: number;
}

export interface QAHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface NextStep {
  id: string;
  text: string;
  category: 'Do Now' | 'Do Soon' | 'Optional';
  isTimeSensitive: boolean;
  deadline?: string | null;
}

export interface ComparisonHighlight {
  type: 'conflict' | 'missing' | 'difference';
  clauseText: string;
  matchedClauseText?: string;  // clause in other document
  summary: string;
  documentName?: string;
}

export interface ComparisonResult {
  highlights: [ComparisonHighlight[], ComparisonHighlight[]];  // [docA, docB]
  totalDifferences: number;
  totalConflicts: number;
  totalMissing: number;
}

export interface AttorneyHeading {
  key: 'understanding-rights' | 'clarifying-obligations' | 'identifying-risks' | 'before-signing';
  label: string;
}

export interface AttorneyPackData {
  documentId: string;
  headings: AttorneyHeading[];
  questionsByHeading: Record<string, string[]>;
  disclaimer: string;
  totalQuestions: number;
}
```

### `types/checklist.ts`

```typescript
export type ChecklistHeading =
  | 'Your Obligations'
  | 'Your Rights'
  | 'Important Deadlines'
  | 'Actions Required Before Signing';

export interface ChecklistEntry {
  id: string;
  text: string;
  clauseRef?: string | null;   // clause number/title if available
  checked: boolean;
}

export interface ChecklistData {
  documentId: string;
  items: Record<ChecklistHeading, ChecklistEntry[]>;
  generatedAt: number;
}
```

### `types/common.ts`

```typescript
export type FeatureTab =
  | 'summary'
  | 'risk-graph'
  | 'comparison'
  | 'clauses'
  | 'qa'
  | 'checklist'
  | 'next-steps'
  | 'attorney-pack';

export interface HighlightedClause {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  category: ClauseCategory;
  riskLevel: RiskLevel;
  summary: string;
  isUnfair?: boolean;
}

export type ClauseCategory =
  | 'obligations'
  | 'rights'
  | 'limitations-of-liability'
  | 'termination'
  | 'indemnification'
  | 'jurisdiction'
  | 'unusual-or-one-sided';
```

---

## Data Models

All data models are defined as TypeScript interfaces in `src/types/`. Key models are summarised here for reference.

### Document Models (`types/document.ts`)

| Field | Type | Description |
|---|---|---|
| `ParsedDocument.id` | `string` (UUID) | Client-generated unique identifier |
| `ParsedDocument.name` | `string` | Original filename |
| `ParsedDocument.text` | `string` | Full extracted plain text |
| `ParsedDocument.wordCount` | `number` | Whitespace-delimited token count |
| `ParsedDocument.pageCount` | `number?` | PDF only |
| `ParsedDocument.format` | `'pdf' \| 'docx' \| 'txt'` | Source format |

### Graph Models (`types/graph.ts`)

| Field | Type | Description |
|---|---|---|
| `RiskNode.id` | `string` | Matches `clauseId` |
| `RiskNode.data.riskLevel` | `RiskLevel` | `'critical' \| 'moderate' \| 'low'` |
| `RiskNode.data.documentIndex` | `0 \| 1` | Source document slot |
| `RiskEdge.type` | `'default' \| 'conflict'` | Conflict edges render in purple |

### AI Output Models (`types/ai.ts`)

| Model | Key Fields |
|---|---|
| `SummaryResult` | `sections: SummarySection[]`, `disclaimer: string` |
| `QAMessage` | `role`, `content`, `confidenceScore`, `citation` |
| `NextStep` | `text`, `category` (`Do Now / Do Soon / Optional`), `isTimeSensitive`, `deadline?` |
| `ComparisonResult` | `highlights[2]`, `totalDifferences`, `totalConflicts`, `totalMissing` |
| `AttorneyPackData` | `questionsByHeading: Record<string, string[]>`, `totalQuestions` |

### Checklist Models (`types/checklist.ts`)

| Model | Key Fields |
|---|---|
| `ChecklistEntry` | `id`, `text`, `clauseRef?`, `checked: boolean` |
| `ChecklistData` | `items: Record<ChecklistHeading, ChecklistEntry[]>` |

The four `ChecklistHeading` values are: `'Your Obligations'`, `'Your Rights'`, `'Important Deadlines'`, `'Actions Required Before Signing'`.

### Common Models (`types/common.ts`)

| Model | Key Fields |
|---|---|
| `HighlightedClause` | `id`, `text`, `startOffset`, `endOffset`, `category: ClauseCategory`, `riskLevel`, `summary`, `isUnfair?` |
| `FeatureTab` | Union of 8 tab keys (summary, risk-graph, comparison, clauses, qa, checklist, next-steps, attorney-pack) |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File type validation rejects non-legal formats

*For any* file object, `validateFileType()` SHALL return `valid: false` for extensions other than `.pdf`, `.docx`, and `.txt`, and `valid: true` for exactly those three extensions.

**Validates: Requirements 1.1, 1.7**

---

### Property 2: Document metadata correctness

*For any* successfully parsed document, the returned `ParsedDocument.wordCount` SHALL equal the number of whitespace-delimited tokens in `ParsedDocument.text`, and `ParsedDocument.name` SHALL equal the original filename.

**Validates: Requirements 1.8**

---

### Property 3: Token chunk size invariant

*For any* document text of arbitrary length, every `TextChunk` produced by `chunkDocument()` SHALL have `tokenCount ≤ 2000`. The union of all chunk texts SHALL cover the entire original document text (no content dropped).

**Validates: Requirements 12.7**

---

### Property 4: Plain-language summary always contains a disclaimer

*For any* `SummaryResult` returned by the summarize pipeline, `SummaryResult.disclaimer` SHALL be a non-empty string and SHALL contain the words "informational purposes only" and "does not constitute legal advice".

**Validates: Requirements 2.5, 13.3**

---

### Property 5: Summary always has labeled sections

*For any* `SummaryResult`, `SummaryResult.sections` SHALL be a non-empty array where every element has a non-empty `title` string.

**Validates: Requirements 2.3**

---

### Property 6: Risk node color invariant

*For any* `RiskNode` with `data.riskLevel = 'critical'`, the resolved background color SHALL be from the red palette. *For any* node with `'moderate'`, it SHALL be amber. *For any* node with `'low'`, it SHALL be green. This mapping SHALL be exhaustive and consistent across all nodes.

**Validates: Requirements 3.3**

---

### Property 7: Risk graph node-per-clause invariant

*For any* list of N clauses returned by the Gemini risk-graph prompt, the resulting `RiskGraphData` SHALL contain exactly N nodes, one per clause, with each node's `clauseId` matching a clause in the input.

**Validates: Requirements 3.2**

---

### Property 8: Clause category set invariant

*For any* document text processed by the clause highlighter, every `HighlightedClause.category` in the result SHALL be a member of the seven defined `ClauseCategory` values (obligations, rights, limitations-of-liability, termination, indemnification, jurisdiction, unusual-or-one-sided).

**Validates: Requirements 5.1**

---

### Property 9: Sidebar grouping count invariant

*For any* list of `HighlightedClause[]`, grouping by category and summing the per-category counts SHALL equal the total number of items in the input list. No clause SHALL appear in more than one category group.

**Validates: Requirements 5.4**

---

### Property 10: RAG prompt always includes retrieved chunks

*For any* Q&A question submitted with a non-empty document, the prompt constructed by `buildQAPrompt()` SHALL include the text of at least one `TextChunk` from the document.

**Validates: Requirements 6.2**

---

### Property 11: Q&A successful response always includes confidence score and citation

*For any* successfully completed Q&A response (no error event), the final SSE event stream SHALL include exactly one `confidence` event with `score` in [0, 100] and a `citation` field (which may be `null` only if no citation is available).

**Validates: Requirements 6.4**

---

### Property 12: Prompt injection detection rejects known patterns

*For any* string containing a substring that matches one of the defined `INJECTION_PATTERNS`, `checkForInjection()` SHALL return `{ isSafe: false }`. *For any* string containing none of those patterns, it SHALL return `{ isSafe: true }`.

**Validates: Requirements 6.8, 11.7**

---

### Property 13: PII redaction leaves no raw PII in output

*For any* text containing a substring matching one of the defined `PII_PATTERNS`, `redactPii(text).redactedText` SHALL not contain that original matched substring.

**Validates: Requirements 11.3**

---

### Property 14: Next steps count is always in [3, 7]

*For any* `NextStep[]` returned by the next-steps pipeline, the array length SHALL be ≥ 3 and ≤ 7.

**Validates: Requirements 7.1**

---

### Property 15: Next steps always contains an attorney step and disclaimer

*For any* `NextStep[]` returned by the next-steps pipeline, at least one step SHALL contain the word "attorney" or "lawyer" in its text. The accompanying `disclaimer` field SHALL be non-empty.

**Validates: Requirements 7.2, 7.5, 13.3**

---

### Property 16: Next steps categories are exhaustive and valid

*For any* `NextStep` in the next-steps output, `step.category` SHALL be exactly one of `'Do Now'`, `'Do Soon'`, or `'Optional'`.

**Validates: Requirements 7.3**

---

### Property 17: Checklist always has all four required headings

*For any* `ChecklistData` returned by the checklist pipeline, `Object.keys(checklist.items)` SHALL include all four strings: `'Your Obligations'`, `'Your Rights'`, `'Important Deadlines'`, and `'Actions Required Before Signing'`.

**Validates: Requirements 8.2**

---

### Property 18: Checklist items with clause refs include the ref

*For any* `ChecklistEntry` where a clause reference is present in the source document, `entry.clauseRef` SHALL be a non-null, non-empty string.

**Validates: Requirements 8.3**

---

### Property 19: Attorney pack question count is in [8, 15]

*For any* `AttorneyPackData`, the total number of questions across all headings (`sum of questionsByHeading[heading].length`) SHALL be ≥ 8 and ≤ 15.

**Validates: Requirements 9.2**

---

### Property 20: All AI outputs include a disclaimer

*For any* output type (summary, checklist, next steps, attorney pack, Q&A answer), the serialized output text SHALL include a non-empty disclaimer field. This is a cross-cutting invariant that binds all AI-output generating pipelines.

**Validates: Requirements 2.5, 7.5, 9.6, 13.3**

---

### Property 21: WCAG contrast ratio invariant for all clause category colors

*For any* of the seven `ClauseCategory` values, the background color paired with its text color in `RISK_COLOR_MAP` SHALL yield a contrast ratio ≥ 4.5:1 as computed by `colorUtils.getContrastRatio()`.

**Validates: Requirements 5.2, 10.1**

---

## Error Handling

### Error Classification

| Error Type | HTTP Status | User Action |
|---|---|---|
| Unsupported file format | — (client) | Show accepted formats, prompt re-upload |
| File too large | — (client) | Show 10 MB limit, prompt re-upload |
| Gemini API error (5xx) | 502 | Show error banner, offer Retry button |
| Gemini API rate limit (429) | 429 | Show retry-after message |
| App rate limit exceeded | 429 | Show retry-after countdown |
| Parse error (corrupt file) | — (client) | Show parse failure, prompt re-upload |
| Injection detected | 400 | Show generic "invalid input" message |
| Session expired / tab closed | — (lifecycle) | Silent cleanup, no user notification |
| Missing env variable | 500 (startup) | Log and exit; never shown to end users |

### Error Boundary Strategy

- React Error Boundaries wrap each major panel (`SummaryPanel`, `RiskDNAGraph`, `QAChat`, etc.) independently.
- An error in one panel does not crash adjacent features.
- Each boundary renders `<ErrorBanner />` with a panel-scoped retry action.

### Retry Logic

- Client retries for Gemini 5xx errors: exponential backoff, max 3 attempts (500ms → 1s → 2s).
- Retry does not re-upload the document; uses the already-parsed text from Zustand state.

---

## Testing Strategy

### Testing Stack

- **Unit tests**: Vitest + React Testing Library
- **Property-based tests**: fast-check
- **Coverage**: `@vitest/coverage-v8` — target ≥80% on `lib/` utilities

### Test File Organization

```
__tests__/
├── unit/
│   ├── document/
│   │   ├── documentValidator.test.ts
│   │   ├── pdfParser.test.ts
│   │   ├── docxParser.test.ts
│   │   └── txtParser.test.ts
│   ├── ai/
│   │   ├── ragChunker.test.ts
│   │   ├── ragRetriever.test.ts
│   │   └── prompts/
│   │       ├── summaryPrompt.test.ts
│   │       └── qaPrompt.test.ts
│   ├── security/
│   │   ├── piiRedactor.test.ts
│   │   ├── injectionGuard.test.ts
│   │   └── rateLimiter.test.ts
│   ├── export/
│   │   ├── pdfExporter.test.ts
│   │   └── clipboardExporter.test.ts
│   └── utils/
│       ├── tokenCounter.test.ts
│       ├── colorUtils.test.ts
│       └── requestDeduplicator.test.ts
├── property/
│   ├── fileValidation.property.test.ts   # Properties 1, 2
│   ├── ragChunker.property.test.ts       # Property 3
│   ├── summaryOutput.property.test.ts    # Properties 4, 5, 20
│   ├── riskGraph.property.test.ts        # Properties 6, 7
│   ├── clauseHighlighter.property.test.ts # Properties 8, 9, 21
│   ├── qaOutput.property.test.ts         # Properties 10, 11
│   ├── security.property.test.ts         # Properties 12, 13
│   ├── nextSteps.property.test.ts        # Properties 14, 15, 16
│   ├── checklist.property.test.ts        # Properties 17, 18
│   └── attorneyPack.property.test.ts     # Property 19
└── integration/
    ├── api/
    │   ├── summarize.api.test.ts
    │   ├── riskGraph.api.test.ts
    │   └── qa.api.test.ts
    └── streaming.test.ts
```

### Property Test Configuration

Each property test uses fast-check with a minimum of 100 runs:

```typescript
// Example: ragChunker.property.test.ts
import { fc } from 'fast-check';
import { chunkDocument } from '@/lib/ai/ragChunker';
import { approximateTokens } from '@/lib/utils/tokenCounter';

// Feature: ai-legal-assistant, Property 3: Token chunk size invariant
test('all chunks have tokenCount ≤ 2000', () => {
  fc.assert(
    fc.property(fc.string({ minLength: 100, maxLength: 50_000 }), (text) => {
      const chunks = chunkDocument(text);
      return chunks.every(c => c.tokenCount <= 2000);
    }),
    { numRuns: 100 }
  );
});

// Feature: ai-legal-assistant, Property 3: No content dropped
test('chunk union covers entire document', () => {
  fc.assert(
    fc.property(fc.string({ minLength: 100, maxLength: 50_000 }), (text) => {
      const chunks = chunkDocument(text);
      const reconstructed = chunks.map(c => c.text).join('');
      // All original text appears somewhere in the chunks (order may differ due to overlap)
      return text.replace(/\s+/g, '').split('').every(
        char => reconstructed.includes(char)
      );
    }),
    { numRuns: 100 }
  );
});
```

### Unit Test Coverage Targets

| Module | Target |
|---|---|
| `lib/document/` | 90% |
| `lib/ai/ragChunker.ts` | 95% |
| `lib/ai/ragRetriever.ts` | 85% |
| `lib/security/` | 95% |
| `lib/export/` | 80% |
| `lib/utils/` | 90% |
| `app/api/` route handlers | 80% |
| React components (`src/components/`) | 70% |

### CI Pipeline (`/.github/workflows/ci.yml`)

Steps (run on every PR):
1. `npm run typecheck` — TypeScript strict mode, zero errors
2. `npm run lint` — ESLint with `@typescript-eslint` + `eslint-plugin-jsx-a11y`
3. `npm run test:unit` — Vitest unit suite
4. `npm run test:property` — Vitest property-based suite (fast-check)
5. `npm run test:coverage` — fail if coverage < 80% on `lib/`

---

## Complete File/Folder Structure

```
lexai/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .kiro/
│   └── specs/
│       └── ai-legal-assistant/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       ├── summarize/route.ts
│       ├── risk-graph/route.ts
│       ├── compare/route.ts
│       ├── qa/route.ts
│       ├── checklist/route.ts
│       ├── next-steps/route.ts
│       └── attorney-pack/route.ts
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppFooter.tsx
│   │   │   └── DisclaimerModal.tsx
│   │   ├── document/
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── DocumentMeta.tsx
│   │   │   └── DocumentViewer.tsx
│   │   ├── summary/
│   │   │   ├── SummaryPanel.tsx
│   │   │   └── SummarySection.tsx
│   │   ├── graph/
│   │   │   ├── RiskDNAGraph.tsx
│   │   │   ├── RiskDNAGraphInner.tsx
│   │   │   ├── ClauseNode.tsx
│   │   │   ├── ConflictEdge.tsx
│   │   │   ├── GraphLegend.tsx
│   │   │   └── GraphAccessibilityTable.tsx
│   │   ├── comparison/
│   │   │   ├── ComparisonView.tsx
│   │   │   ├── ComparisonPane.tsx
│   │   │   └── ComparisonSummaryPanel.tsx
│   │   ├── clauses/
│   │   │   ├── ClauseHighlighter.tsx
│   │   │   ├── ClauseSidebar.tsx
│   │   │   ├── ClauseTooltip.tsx
│   │   │   └── ClauseRiskHeader.tsx
│   │   ├── qa/
│   │   │   ├── QAChat.tsx
│   │   │   ├── QAMessage.tsx
│   │   │   └── ConfidenceScore.tsx
│   │   ├── checklist/
│   │   │   ├── ChecklistPanel.tsx
│   │   │   └── ChecklistItem.tsx
│   │   ├── next-steps/
│   │   │   └── NextStepsPanel.tsx
│   │   ├── attorney/
│   │   │   └── AttorneyPackPanel.tsx
│   │   ├── shared/
│   │   │   ├── StreamingText.tsx
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── ErrorBanner.tsx
│   │   │   ├── RetryButton.tsx
│   │   │   ├── ExportButton.tsx
│   │   │   ├── DisclaimerBadge.tsx
│   │   │   └── AccessibilityToggle.tsx
│   │   └── tabs/
│   │       └── FeatureTabs.tsx
│   ├── hooks/
│   │   ├── useDocumentStore.ts
│   │   ├── useStreamingResponse.ts
│   │   ├── useSessionCache.ts
│   │   └── useAccessibility.ts
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── geminiClient.ts
│   │   │   ├── streamHandler.ts
│   │   │   ├── ragChunker.ts
│   │   │   ├── ragRetriever.ts
│   │   │   └── prompts/
│   │   │       ├── index.ts
│   │   │       ├── summaryPrompt.ts
│   │   │       ├── riskGraphPrompt.ts
│   │   │       ├── comparisonPrompt.ts
│   │   │       ├── qaPrompt.ts
│   │   │       ├── checklistPrompt.ts
│   │   │       ├── nextStepsPrompt.ts
│   │   │       └── attorneyPackPrompt.ts
│   │   ├── document/
│   │   │   ├── pdfParser.ts
│   │   │   ├── docxParser.ts
│   │   │   ├── txtParser.ts
│   │   │   └── documentValidator.ts
│   │   ├── security/
│   │   │   ├── piiRedactor.ts
│   │   │   ├── injectionGuard.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── cspConfig.ts
│   │   ├── export/
│   │   │   ├── pdfExporter.ts
│   │   │   └── clipboardExporter.ts
│   │   └── utils/
│   │       ├── tokenCounter.ts
│   │       ├── requestDeduplicator.ts
│   │       └── colorUtils.ts
│   ├── store/
│   │   └── documentStore.ts
│   └── types/
│       ├── document.ts
│       ├── graph.ts
│       ├── ai.ts
│       ├── checklist.ts
│       └── common.ts
├── __tests__/
│   ├── unit/
│   │   ├── document/
│   │   │   ├── documentValidator.test.ts
│   │   │   ├── pdfParser.test.ts
│   │   │   ├── docxParser.test.ts
│   │   │   └── txtParser.test.ts
│   │   ├── ai/
│   │   │   ├── ragChunker.test.ts
│   │   │   ├── ragRetriever.test.ts
│   │   │   └── prompts/
│   │   │       ├── summaryPrompt.test.ts
│   │   │       └── qaPrompt.test.ts
│   │   ├── security/
│   │   │   ├── piiRedactor.test.ts
│   │   │   ├── injectionGuard.test.ts
│   │   │   └── rateLimiter.test.ts
│   │   ├── export/
│   │   │   ├── pdfExporter.test.ts
│   │   │   └── clipboardExporter.test.ts
│   │   └── utils/
│   │       ├── tokenCounter.test.ts
│   │       ├── colorUtils.test.ts
│   │       └── requestDeduplicator.test.ts
│   ├── property/
│   │   ├── fileValidation.property.test.ts
│   │   ├── ragChunker.property.test.ts
│   │   ├── summaryOutput.property.test.ts
│   │   ├── riskGraph.property.test.ts
│   │   ├── clauseHighlighter.property.test.ts
│   │   ├── qaOutput.property.test.ts
│   │   ├── security.property.test.ts
│   │   ├── nextSteps.property.test.ts
│   │   ├── checklist.property.test.ts
│   │   └── attorneyPack.property.test.ts
│   └── integration/
│       ├── api/
│       │   ├── summarize.api.test.ts
│       │   ├── riskGraph.api.test.ts
│       │   └── qa.api.test.ts
│       └── streaming.test.ts
├── public/
│   └── favicon.ico
├── .env.example
├── .eslintrc.json
├── .gitignore
├── middleware.ts
├── next.config.js
├── package.json
├── README.md
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

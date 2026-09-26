# Implementation Plan: LexAI — AI-Powered Legal Assistant

## Overview

This plan converts the LexAI design into an ordered sequence of coding tasks that build layer-by-layer toward a fully working Next.js 14 + TypeScript + Tailwind + Gemini API application. The sequence is: scaffolding → types & store → document processing → AI service layer → API routes → core UI → feature panels → Risk DNA Graph → comparison → export → accessibility & security hardening → tests → deployment prep. Each layer produces runnable, integrated code before the next begins — the app is usable after Phase 5.

---

## Tasks

- [ ] 1. Project Scaffolding and Tooling
  - Initialize a Next.js 14 App Router project with TypeScript strict mode, Tailwind CSS, and ESLint (`create-next-app --typescript --tailwind --eslint --app`)
  - Configure `tsconfig.json` with `"strict": true`, `"paths": { "@/*": ["./src/*"] }`, and `"moduleResolution": "bundler"`
  - Install core runtime dependencies: `@google/generative-ai`, `zustand`, `pdfjs-dist`, `mammoth`, `reactflow`, `dagre`, `jspdf`, `html2canvas`, `fast-check` (dev)
  - Install test dependencies: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`
  - Create `vitest.config.ts` with `environment: 'jsdom'`, coverage thresholds (80% on `src/lib/`), and `test:unit`, `test:property`, `test:coverage` scripts in `package.json`
  - Create `.github/workflows/ci.yml` with steps: typecheck → lint → test:unit → test:property → test:coverage (fail on coverage <80% for `lib/`)
  - Add `.env.example` with `GEMINI_API_KEY=your_key_here` and `NEXT_PUBLIC_APP_URL=http://localhost:3000`
  - Add `.gitignore` entries for `.env.local`, `node_modules/`, `.next/`, `coverage/`
  - _Requirements: 14.1, 14.2, 14.4, 15.1, 15.4_

- [x] 2. TypeScript Type Definitions
  - [x] 2.1 Create `src/types/document.ts` with `ParsedDocument`, `DocumentError`, `ValidationResult` interfaces exactly as defined in design
    - Export all types as named exports
    - `ParsedDocument`: id (UUID), name, text, wordCount, pageCount?, format, parsedAt
    - `DocumentError.code`: `'UNSUPPORTED_FORMAT' | 'FILE_TOO_LARGE' | 'TOO_MANY_DOCUMENTS' | 'PARSE_ERROR'`
    - _Requirements: 1.1, 1.3, 1.7, 1.8_

  - [x] 2.2 Create `src/types/graph.ts` with `RiskLevel`, `RiskNode`, `ClauseNodeData`, `RiskEdge`, `RiskGraphData` interfaces
    - `RiskLevel`: `'critical' | 'moderate' | 'low'`
    - `RiskNode.type` must be the literal `'clauseNode'`
    - `RiskEdge.type`: `'default' | 'conflict'`
    - _Requirements: 3.2, 3.3_

  - [x] 2.3 Create `src/types/ai.ts` with `SummarySection`, `SummaryResult`, `QAMessage`, `QAHistoryItem`, `NextStep`, `ComparisonHighlight`, `ComparisonResult`, `AttorneyHeading`, `AttorneyPackData`
    - `NextStep.category`: `'Do Now' | 'Do Soon' | 'Optional'`
    - `AttorneyHeading.key`: union of 4 heading keys
    - _Requirements: 2.3, 6.4, 7.3, 9.3_

  - [x] 2.4 Create `src/types/checklist.ts` with `ChecklistHeading` union type, `ChecklistEntry`, `ChecklistData`
    - `ChecklistHeading`: exactly `'Your Obligations' | 'Your Rights' | 'Important Deadlines' | 'Actions Required Before Signing'`
    - `ChecklistData.items`: `Record<ChecklistHeading, ChecklistEntry[]>`
    - _Requirements: 8.2_

  - [x] 2.5 Create `src/types/common.ts` with `FeatureTab` union (8 values), `HighlightedClause`, `ClauseCategory` union (7 values)
    - `ClauseCategory`: obligations, rights, limitations-of-liability, termination, indemnification, jurisdiction, unusual-or-one-sided
    - _Requirements: 5.1_

- [x] 3. Zustand Store and Session Cache
  - [x] 3.1 Create `src/store/documentStore.ts` implementing the full `DocumentStore` interface
    - Implement all actions: setDocument, clearDocument, setChunks, setSummary, setRiskGraph, setComparisonResult, setHighlightedClauses, addQAMessage, setChecklist, toggleChecklistItem, setNextSteps, setAttorneyPack, setActiveTab, toggleAccessibilityMode, acknowledgeDisclaimer, clearAll
    - No persistence middleware — pure in-memory Zustand store
    - _Requirements: 1.6, 11.8, 11.9_

  - [x] 3.2 Create `src/hooks/useDocumentStore.ts` as a typed selector hook wrapping the Zustand store
    - Export `useDocumentStore` with full `DocumentStore` type inference
    - _Requirements: 14.1_

  - [x] 3.3 Create `src/hooks/useSessionCache.ts` implementing `useSessionCache<T>(key: string)` with `get`, `set`, `clear`
    - Cache summaries under key `lexai_summary_${documentId}`, graphs under `lexai_graph_${documentId}`
    - Call `set` immediately upon generation completion (not deferred)
    - Check cache on feature tab load before triggering API call
    - _Requirements: 12.5_

  - [x] 3.4 Create `src/hooks/useAccessibility.ts` returning `{ isAccessibilityMode, toggleAccessibilityMode }` wired to the Zustand store
    - Apply `font-size: 18px` and high-contrast CSS class to `<body>` when mode is active
    - _Requirements: 10.8_

- [x] 4. Utility Layer
  - [x] 4.1 Create `src/lib/utils/tokenCounter.ts` exporting `approximateTokens(text: string): number`
    - Use the `Math.ceil(text.length / 4)` heuristic (GPT-family approximation, adequate for chunking)
    - Export as named export with JSDoc comment
    - _Requirements: 12.7_

  - [x] 4.2 Create `src/lib/utils/colorUtils.ts` exporting `RISK_COLOR_MAP`, `CONFLICT_EDGE_COLOR`, and `getContrastRatio(hex1: string, hex2: string): number`
    - `getContrastRatio` implements WCAG 2.1 relative luminance formula
    - All color pairs in `RISK_COLOR_MAP` must yield ratio ≥ 4.5 (verified in unit test)
    - _Requirements: 3.3, 5.2, 10.1_

  - [x] 4.3 Create `src/lib/utils/requestDeduplicator.ts` exporting `deduplicateRequest(key, requestFn, windowMs?): Promise<Response>`
    - Use `Map<string, Promise<Response>>` as pending-request registry
    - Default `windowMs = 500`; remove entry after resolution
    - _Requirements: 12.4_

- [ ] 5. Security Layer
  - [x] 5.1 Create `src/lib/security/piiRedactor.ts` exporting `redactPii(text: string): RedactionResult`
    - Implement all 7 PII regex patterns from design in order (SSN, phone, email, address, ZIP, ID numbers, person names)
    - `redactionMap` stores `placeholder → original` for display only; never transmitted to AI
    - _Requirements: 11.3_

  - [x] 5.2 Create `src/lib/security/injectionGuard.ts` exporting `checkForInjection(input: string): InjectionCheckResult`
    - Implement all 7 injection detection regex patterns from design
    - Return `{ isSafe: false, detectedPattern }` on any match
    - _Requirements: 6.8, 11.7_

  - [x] 5.3 Create `src/lib/security/rateLimiter.ts` exporting `checkRateLimit(ip: string, limit?: number, windowMs?: number): RateLimitResult`
    - Sliding window: `Map<string, { count: number; windowStart: number }>` keyed by IP
    - Defaults: limit=20, windowMs=60_000
    - Return `{ allowed: false, retryAfter }` in seconds when limit is exceeded
    - _Requirements: 11.4_

  - [x] 5.4 Create `src/lib/security/cspConfig.ts` exporting `buildCspHeader(): string` and `generateNonce(): string`
    - CSP directives as specified in design: `default-src 'self'`, `script-src 'self' 'nonce-{nonce}'`, `img-src 'self' data: blob:`, `connect-src 'self' https://generativelanguage.googleapis.com`, `object-src 'none'`, `frame-ancestors 'none'`
    - _Requirements: 11.6_

  - [-] 5.5 Create `src/middleware.ts` (Next.js middleware) that calls `buildCspHeader()` and `checkRateLimit()` on every API route request
    - Inject CSP nonce via response headers
    - Return HTTP 429 with `Retry-After` header when rate limit is exceeded
    - Enforce HTTPS redirect in production
    - _Requirements: 11.1, 11.4, 11.6_

- [ ] 6. Document Processing Layer
  - [-] 6.1 Create `src/lib/document/documentValidator.ts` exporting `validateFileType`, `validateFileSize`, `validateFileCount`
    - `validateFileType`: accept only `.pdf`, `.docx`, `.txt`; return `ValidationResult`
    - `validateFileSize`: default max 10 MB; return error with size info
    - `validateFileCount`: default max 2 documents
    - _Requirements: 1.1, 1.3, 1.5, 1.7_

  - [ ] 6.2 Create `src/lib/document/pdfParser.ts` exporting `parsePdf(file: File): Promise<ParsedDocument>`
    - Use `pdfjs-dist` to load the file as `ArrayBuffer`, iterate pages, call `getTextContent()`, join `TextItem.str` values
    - Return `{ id, name, text, wordCount, pageCount, format: 'pdf', parsedAt }`
    - Must resolve within 5 s for files ≤ 10 MB
    - _Requirements: 1.2, 1.8, 12.8_

  - [ ] 6.3 Create `src/lib/document/docxParser.ts` exporting `parseDocx(file: File): Promise<ParsedDocument>`
    - Use `mammoth.extractRawText({ arrayBuffer })` to extract text
    - Return `ParsedDocument` with `format: 'docx'` and computed `wordCount`
    - _Requirements: 1.2, 1.8_

  - [ ] 6.4 Create `src/lib/document/txtParser.ts` exporting `parseTxt(file: File): Promise<ParsedDocument>`
    - Use `FileReader.readAsText()` wrapped in a Promise
    - Return `ParsedDocument` with `format: 'txt'` and computed `wordCount`
    - _Requirements: 1.2, 1.8_

- [ ] 7. AI Utility Layer
  - [ ] 7.1 Create `src/lib/ai/ragChunker.ts` exporting `chunkDocument(text: string, maxTokens?: number): TextChunk[]`
    - Split on sentence boundary regex `/(?<=[.!?])\s+(?=[A-Z])/`
    - Accumulate sentences until buffer reaches 1,800 tokens; emit chunk with 2-sentence overlap
    - Tag each chunk with UUID `chunkId`, `startOffset`, `endOffset`, `tokenCount`, `text`
    - _Requirements: 6.2, 12.7_

  - [ ] 7.2 Create `src/lib/ai/ragRetriever.ts` exporting `retrieveTopChunks(query: string, chunks: TextChunk[], topK?: number): TextChunk[]`
    - BM25-style scoring: tokenize query and chunks, score by term-frequency overlap, return top-K (default 5) sorted descending
    - _Requirements: 6.2_

  - [-] 7.3 Create `src/lib/ai/geminiClient.ts` (server-only) exporting `getFlashModel()` and `getProModel()`
    - Initialize `GoogleGenerativeAI` with `process.env.GEMINI_API_KEY`
    - File must be marked with `'server-only'` import guard (add `import 'server-only'` at top)
    - _Requirements: 11.2_

  - [-] 7.4 Create `src/lib/ai/streamHandler.ts` exporting `buildSSEResponse(streamIterable, eventTransformer): Promise<Response>`
    - Build a `ReadableStream` that iterates Gemini chunks, applies `eventTransformer`, formats as SSE `data:` frames, and flushes
    - Set `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
    - _Requirements: 2.2, 6.3_

  - [ ] 7.5 Create all prompt files in `src/lib/ai/prompts/`:
    - `summaryPrompt.ts`: `buildSummaryPrompt(documentText)` — instructs Gemini to produce labeled JSON sections matching document structure, FK reading level ≤8, trailing disclaimer
    - `riskGraphPrompt.ts`: `buildRiskGraphPrompt(documentText, comparisonText?)` — requests JSON array of `{ clauseId, title, text, riskLevel, riskReason, relatedClauses[] }`
    - `comparisonPrompt.ts`: `buildComparisonPrompt(textA, textB)` — structured diff, returns conflict/missing/difference events
    - `qaPrompt.ts`: `buildQAPrompt(question, chunks, history)` — RAG prompt injecting top-k chunk texts; instructs "I cannot find relevant information" for out-of-scope and to include confidence score 0–100 plus clause citation
    - `checklistPrompt.ts`: `buildChecklistPrompt(documentText)` — generates structured JSON with all 4 required headings
    - `nextStepsPrompt.ts`: `buildNextStepsPrompt(documentText, summaryText)` — 3–7 steps with category tags and deadline extraction
    - `attorneyPackPrompt.ts`: `buildAttorneyPackPrompt(documentText, summaryText, riskGraphData)` — 8–15 document-specific questions grouped by 4 headings
    - `index.ts`: re-exports all named exports and `PROMPT_VERSION` constants
    - Each file exports `PROMPT_VERSION = 'v1'` and `PROMPT_NAME` constant
    - _Requirements: 2.1, 3.1, 4.1, 6.1, 7.1, 8.1, 9.1, 14.7_

- [ ] 8. API Routes
  - [ ] 8.1 Create `app/api/summarize/route.ts` implementing `POST /api/summarize`
    - Apply middleware chain: `checkRateLimit → validateInput → redactPii → checkForInjection`
    - Call `getFlashModel()`, use `buildSummaryPrompt`, stream response via `buildSSEResponse`
    - Emit `SummaryStreamEvent` types: section, disclaimer, done, error
    - _Requirements: 2.1, 2.2, 2.7, 11.3, 11.4, 11.5_

  - [ ] 8.2 Create `app/api/risk-graph/route.ts` implementing `POST /api/risk-graph`
    - Apply full middleware chain
    - Call `getProModel()`, use `buildRiskGraphPrompt`, return `application/json` `RiskGraphResponse`
    - Parse Gemini response JSON into `RiskNode[]` and `RiskEdge[]`
    - _Requirements: 3.1, 3.2, 3.3, 11.3, 11.4_

  - [ ] 8.3 Create `app/api/compare/route.ts` implementing `POST /api/compare`
    - Apply full middleware chain
    - Call `getProModel()`, use `buildComparisonPrompt`, stream `CompareStreamEvent` types
    - Emit: difference, conflict, missing, summary, done, error
    - _Requirements: 4.1, 4.3, 4.4, 4.7, 11.3_

  - [ ] 8.4 Create `app/api/qa/route.ts` implementing `POST /api/qa`
    - Apply full middleware chain including injection guard on the `question` field specifically
    - Call `getFlashModel()`, use `buildQAPrompt`, stream `QAStreamEvent` types
    - Emit: token, confidence, disclaimer, done, error
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7, 6.8, 11.3_

  - [ ] 8.5 Create `app/api/checklist/route.ts` implementing `POST /api/checklist`
    - Apply full middleware chain
    - Call `getFlashModel()`, use `buildChecklistPrompt`, stream `ChecklistStreamEvent` types
    - Emit: heading, item, done, error
    - _Requirements: 8.1, 8.2, 11.3_

  - [ ] 8.6 Create `app/api/next-steps/route.ts` implementing `POST /api/next-steps`
    - Apply full middleware chain
    - Call `getFlashModel()`, use `buildNextStepsPrompt`, stream `NextStepsStreamEvent` types
    - Emit: step, disclaimer, done, error
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 11.3_

  - [ ] 8.7 Create `app/api/attorney-pack/route.ts` implementing `POST /api/attorney-pack`
    - Apply full middleware chain
    - Call `getFlashModel()`, use `buildAttorneyPackPrompt`, stream `AttorneyPackStreamEvent` types
    - Emit: heading, question, disclaimer, done, error
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 11.3_

- [ ] 9. Checkpoint — Core Back-End Working
  - Verify all API routes are reachable with `curl` or Postman using a test document text
  - Ensure all TypeScript compilation errors are zero (`npm run typecheck`)
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Core Layout and Shared Components
  - [ ] 10.1 Create `app/layout.tsx` as the root layout: wraps all pages with `DisclaimerModal`, `AppHeader`, `AppFooter`, global Tailwind styles, and ARIA live region for streaming announcements
    - Apply `<html lang="en">` and `<body>` with Tailwind base classes
    - Import `globals.css`
    - _Requirements: 10.4, 13.1, 13.2_

  - [ ] 10.2 Create `src/components/layout/DisclaimerModal.tsx`
    - Render a modal requiring explicit "I Understand" click before any upload is enabled
    - Persist acknowledgment to Zustand `disclaimerAcknowledged` state
    - Trap focus within the modal while open (ARIA `role="dialog"`, `aria-modal="true"`, `aria-labelledby`)
    - _Requirements: 13.2_

  - [ ] 10.3 Create `src/components/layout/AppHeader.tsx` with `AppHeaderProps`
    - Render `AccessibilityToggle` and "Find a Lawyer" navigation link pointing to a public attorney-finder URL
    - _Requirements: 10.2, 13.4_

  - [ ] 10.4 Create `src/components/layout/AppFooter.tsx`
    - Render persistent disclaimer banner: "LexAI provides legal information only, not legal advice. Always consult a licensed attorney for advice specific to your situation."
    - "Find a Lawyer" resource link
    - _Requirements: 13.1, 13.4_

  - [ ] 10.5 Create `src/components/shared/StreamingText.tsx` with `StreamingTextProps`
    - Render `content` string with cursor animation while `isStreaming` is true
    - Attach `aria-live={ariaLiveMode ?? 'polite'}` and `aria-atomic="false"` to the container
    - _Requirements: 10.6_

  - [ ] 10.6 Create `src/components/shared/LoadingSkeleton.tsx`, `ErrorBanner.tsx`, `RetryButton.tsx`, `DisclaimerBadge.tsx`, `AccessibilityToggle.tsx`
    - `LoadingSkeleton`: animated pulse divs, configurable `lines` count
    - `ErrorBanner`: displays error message, renders `RetryButton` if `onRetry` prop provided
    - `DisclaimerBadge`: small inline badge with disclaimer text for appending to AI outputs
    - `AccessibilityToggle`: button toggling `isAccessibilityMode`; updates `<body>` class and font size
    - _Requirements: 10.3, 10.8, 12.6, 13.3_

  - [ ] 10.7 Create `src/components/shared/ExportButton.tsx` with `ExportButtonProps`
    - Render a dropdown/button group for available formats (`pdf`, `txt`, `png`)
    - Call `onExport(format)` async handler; show loading state during export
    - Keyboard accessible with proper ARIA labels
    - _Requirements: 2.6, 8.5, 9.5, 10.2_

  - [ ] 10.8 Create `src/hooks/useStreamingResponse.ts`
    - Consumes an SSE endpoint URL + POST body, returns `{ data, isStreaming, error, retry }`
    - Implements exponential backoff retry on 5xx: 500ms → 1s → 2s (max 3 attempts)
    - Uses `deduplicateRequest` from `requestDeduplicator.ts` before fetch
    - _Requirements: 2.2, 6.3, 12.2, 12.4_

  - [ ] 10.9 Create `src/components/tabs/FeatureTabs.tsx`
    - Render 8 tabs (summary, risk-graph, comparison, clauses, qa, checklist, next-steps, attorney-pack)
    - Wire active tab to Zustand `activeTab` state
    - Keyboard navigable (arrow keys, `role="tablist"`, `role="tab"`, `aria-selected`)
    - _Requirements: 10.2_

- [ ] 11. Document Upload and Viewer Components
  - [ ] 11.1 Create `src/components/document/DocumentUpload.tsx` with `DocumentUploadProps`
    - Render drag-and-drop zone + file input for `slot: 0 | 1`
    - On file selection: run `validateFileType`, `validateFileSize`, `validateFileCount` before parsing
    - Dispatch to `pdfParser`, `docxParser`, or `txtParser` based on extension
    - Dispatch parsed document to Zustand store; run `chunkDocument` and store chunks
    - Show `ErrorBanner` with specific message for validation failures (format, size, count)
    - Disable upload when `disclaimerAcknowledged` is false
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.7, 13.2_

  - [ ] 11.2 Create `src/components/document/DocumentMeta.tsx` with `DocumentMetaProps`
    - Display document name, page count (PDF only), and word count only after successful parse
    - Display nothing until `ParsedDocument` is available (no partial metadata)
    - _Requirements: 1.8_

  - [ ] 11.3 Create `src/components/document/DocumentViewer.tsx` with `DocumentViewerProps`
    - Render document text with `ClauseHighlighter` overlaid
    - Accept `syncScrollRef` for comparison sync scrolling
    - On clause click, call `onClauseClick(clauseId)` and scroll the clause into view with a visible focus ring
    - _Requirements: 5.5, 4.2_

- [ ] 12. Summary Feature
  - [ ] 12.1 Create `src/components/summary/SummaryPanel.tsx` with `SummaryPanelProps`
    - On mount (when documentId is set), check session cache; if miss, POST to `/api/summarize` via `useStreamingResponse`
    - Set loading skeleton within 200ms of trigger
    - Render sections via `SummarySection` components as they stream in
    - Append `DisclaimerBadge` after last section
    - Show `ExportButton` (pdf, txt formats) after stream completes
    - Show `ErrorBanner` + `RetryButton` on API error without re-upload required
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 2.7, 12.5, 12.6_

  - [ ] 12.2 Create `src/components/summary/SummarySection.tsx` with `SummarySectionProps`
    - Render labeled section with `StreamingText` while streaming
    - Section title renders immediately; content populates token-by-token
    - _Requirements: 2.3_

- [ ] 13. Clause Highlighting Feature
  - [ ] 13.1 Create `src/components/clauses/ClauseHighlighter.tsx` with `ClauseHighlighterProps`
    - Walk document text, apply `<mark>` spans for each `HighlightedClause` with background color from `RISK_COLOR_MAP`
    - Each mark has `data-clause-id`, `role="mark"`, `aria-label` with category + risk level
    - Attach `onMouseEnter`/`onFocus` handlers calling `onClauseHover`/`onClauseFocus`
    - Color coding must meet WCAG 4.5:1 (use pre-verified `RISK_COLOR_MAP` values)
    - _Requirements: 5.2, 5.3, 10.9_

  - [ ] 13.2 Create `src/components/clauses/ClauseTooltip.tsx`
    - Renders on hover/focus of a highlighted clause
    - Shows: clause category, one-sentence plain language summary, risk level
    - If `isUnfair`, show warning icon (⚠️) with explanation text
    - ARIA `role="tooltip"` with `id` linked via `aria-describedby` on the mark element
    - _Requirements: 5.3, 5.6_

  - [ ] 13.3 Create `src/components/clauses/ClauseSidebar.tsx` with `ClauseSidebarProps`
    - Group clauses by `category`, show count badge per group
    - On click, call `onClauseSelect(clauseId)`; apply `aria-current="true"` to active item
    - _Requirements: 5.4, 5.5_

  - [ ] 13.4 Create `src/components/clauses/ClauseRiskHeader.tsx`
    - Show total count of flagged clauses by risk level (critical, moderate, low) using both color and text label
    - _Requirements: 5.7, 10.9_

- [ ] 14. Q&A Chat Feature
  - [ ] 14.1 Create `src/components/qa/QAChat.tsx` with `QAChatProps`
    - Render conversation history (`QAMessage[]`) and an input field + submit button
    - On submit: validate input with `checkForInjection` client-side; if unsafe, show generic "invalid input" message
    - Retrieve top-k chunks with `retrieveTopChunks`, POST to `/api/qa` via `useStreamingResponse`
    - Add user message immediately; add streaming assistant message token-by-token
    - Maintain `conversationHistory` in Zustand `qaHistory` state
    - _Requirements: 6.1, 6.2, 6.3, 6.6, 6.8_

  - [ ] 14.2 Create `src/components/qa/QAMessage.tsx`
    - Render assistant message with `StreamingText` while streaming
    - Show `ConfidenceScore` component after `confidence` SSE event received
    - If no answer generated (error event), suppress `ConfidenceScore` and citation display entirely
    - _Requirements: 6.4_

  - [ ] 14.3 Create `src/components/qa/ConfidenceScore.tsx` with `ConfidenceScoreProps`
    - Render score badge (0–100%) and citation text when available
    - When `score < 60`, display low-confidence notice: "This answer has low confidence — please verify with the original document or a legal professional."
    - _Requirements: 6.4, 6.5_

- [ ] 15. Checklist Feature
  - [ ] 15.1 Create `src/components/checklist/ChecklistItem.tsx` with `ChecklistItemProps`
    - Render a checkbox input with visible label, clauseRef text (when present)
    - `<label>` associated via `htmlFor`/`id` pair
    - _Requirements: 8.3, 8.4, 10.10_

  - [ ] 15.2 Create `src/components/checklist/ChecklistPanel.tsx` with `ChecklistPanelProps`
    - Trigger `/api/checklist` stream on mount if checklist not in store
    - Render items grouped under 4 headings in order: "Your Obligations", "Your Rights", "Important Deadlines", "Actions Required Before Signing"
    - Wire checkbox toggle to `toggleChecklistItem` in Zustand store
    - `ExportButton` generates PDF preserving current check states
    - "Copy to Clipboard" calls `clipboardExporter` and must resolve within 500ms
    - _Requirements: 8.1, 8.2, 8.4, 8.5, 8.6_

- [ ] 16. Next Steps Feature
  - Create `src/components/next-steps/NextStepsPanel.tsx`
  - Trigger `/api/next-steps` stream on mount; render steps as they arrive via `StreamingText`
  - Each step displays category badge ("Do Now" / "Do Soon" / "Optional") and clock icon (⏰) when `isTimeSensitive` is true
  - When deadline is present in `step.deadline`, display it regardless of `isTimeSensitive` flag
  - Append `DisclaimerBadge` after all steps
  - Include `ExportButton` as part of combined output package
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 17. Attorney Pack Feature
  - Create `src/components/attorney/AttorneyPackPanel.tsx`
  - Render "Prepare for My Attorney" trigger button; disable until document is processed
  - On trigger: POST to `/api/attorney-pack` via `useStreamingResponse`; render questions grouped under 4 headings as they stream
  - Append `DisclaimerBadge` after last question
  - `ExportButton` for PDF and plain-text download
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 18. Checkpoint — Core Features Working
  - Wire all feature panels into `FeatureTabs` on `app/page.tsx`
  - Verify end-to-end flow: upload → summary → clauses → Q&A → checklist → next steps → attorney pack
  - Ensure loading skeletons appear within 200ms and streaming begins within 3s
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Risk DNA Graph Feature
  - [ ] 19.1 Create `src/components/graph/RiskDNAGraphInner.tsx` (dynamically imported — no SSR)
    - Import `ReactFlow` and implement the dagre layout algorithm:
      1. Build `dagre.graphlib.Graph` from `RiskNode[]` and `RiskEdge[]`
      2. Direction: `LR` for comparison mode, `TB` for single doc
      3. Node size: `{ width: 180, height: 60 }`
      4. Run `dagre.layout()`, map `{ x, y }` back to React Flow node positions
    - Enable `panOnDrag`, `zoomOnScroll`, zoom controls
    - Wire `onNodeClick` to parent callback
    - _Requirements: 3.5_

  - [ ] 19.2 Create `src/components/graph/ClauseNode.tsx` (React Flow custom node)
    - Render node with background color from `RISK_COLOR_MAP[riskLevel]` 
    - Show `title` and truncated `shortText` (first 120 chars)
    - `aria-label` includes clause title and risk level for screen readers
    - `tabIndex={0}` for keyboard focusability; trigger `onNodeClick` on Enter/Space
    - _Requirements: 3.3, 10.2, 10.4_

  - [ ] 19.3 Create `src/components/graph/ConflictEdge.tsx` (React Flow custom edge)
    - Render edge in `CONFLICT_EDGE_COLOR` (`#7C3AED`) when `edge.type === 'conflict'`
    - Render default color for non-conflict edges
    - _Requirements: 3.6a_

  - [ ] 19.4 Create `src/components/graph/GraphLegend.tsx`
    - Render color legend for red (critical), amber (moderate), green (low), purple (conflict — visible only when `showComparisonColors` is true)
    - Visible without scrolling (positioned in viewport)
    - Each entry uses both color swatch and text label
    - _Requirements: 3.7, 10.9_

  - [ ] 19.5 Create `src/components/graph/GraphAccessibilityTable.tsx`
    - Render a `<table>` listing all nodes (clause title, risk level) and edges (source → target, type)
    - Shown when `isAccessibilityMode` is true, hidden otherwise
    - `<table>` has `aria-label="Risk DNA Graph Data"`
    - _Requirements: 3.8_

  - [ ] 19.6 Create `src/components/graph/RiskDNAGraph.tsx` (lazy-loaded wrapper)
    - Use `next/dynamic` to import `RiskDNAGraphInner` with `ssr: false` and `LoadingSkeleton` fallback
    - Show `GraphAccessibilityTable` when `isAccessibilityMode` is true (in addition to or instead of the visual graph)
    - `onExportPng`: use `html2canvas` on graph container ref, create download link
    - Show `GraphLegend` positioned within viewport
    - _Requirements: 3.5, 3.8, 3.9, 12.3_

  - [ ] 19.7 Wire `RiskDNAGraph` to `/api/risk-graph` in a `RiskGraphContainer` component or directly in the risk-graph tab
    - POST document text on tab activation; cache result in session storage after receipt
    - On node click, show a side panel with full clause text, plain summary, risk level, and risk reason
    - _Requirements: 3.1, 3.4, 12.5_

- [ ] 20. Comparison View Feature
  - [ ] 20.1 Create `src/components/comparison/ComparisonPane.tsx` with `ComparisonPaneProps`
    - Render document text in a scrollable div with `ref={scrollRef}`
    - Apply yellow highlight (`bg-yellow-100`) for "missing" clauses with label "Missing in [Document Name]"
    - Apply red highlight (`bg-red-100`) for "conflict" clauses with tooltip showing conflict summary
    - _Requirements: 4.3, 4.4_

  - [ ] 20.2 Create `src/components/comparison/ComparisonSummaryPanel.tsx`
    - Show total counts for differences, conflicts, and missing clauses in a results header
    - Render navigable list; clicking an item scrolls the matching `ComparisonPane` to that clause
    - _Requirements: 4.5, 4.6_

  - [ ] 20.3 Create `src/components/comparison/ComparisonView.tsx` with `ComparisonViewProps`
    - Render two `ComparisonPane` components side-by-side
    - Synchronize vertical scroll: use a shared `scrollRef` and `onScroll` handler that mirrors `scrollTop` between panels
    - Trigger `/api/compare` stream when two documents are loaded
    - Gate activation: require both `RiskGraphData` to exist; show guidance message if missing
    - Deliver findings progressively as SSE events arrive
    - Show `ExportButton` (pdf only) after finalization step (`done` event received)
    - _Requirements: 3.6, 4.1, 4.2, 4.7, 4.8_

- [ ] 21. Export Functionality
  - [ ] 21.1 Create `src/lib/export/pdfExporter.ts` exporting `exportToPdf(content: string | HTMLElement, filename: string): Promise<void>`
    - Use `jsPDF` to generate PDF; support both text string and rendered HTML element inputs
    - Preserve checkbox checked state when exporting checklist (serialize current Zustand checklist state)
    - _Requirements: 2.6, 4.8, 8.5, 9.5_

  - [ ] 21.2 Create `src/lib/export/clipboardExporter.ts` exporting `copyToClipboard(text: string): Promise<void>`
    - Use `navigator.clipboard.writeText()`; wrap in try/catch with fallback to `document.execCommand('copy')`
    - Must complete within 500ms
    - _Requirements: 8.6_

- [ ] 22. Accessibility and Performance Hardening
  - [ ] 22.1 Audit and fix all interactive elements for keyboard navigation
    - Ensure all buttons, links, inputs, tab panels, Risk DNA Graph nodes have `tabIndex` and keyboard event handlers
    - Verify visible focus indicators meet 3:1 contrast ratio against surrounding background
    - _Requirements: 10.2, 10.3_

  - [ ] 22.2 Add ARIA attributes to all non-text elements
    - `aria-label` on graph nodes, icons, status indicators
    - `alt` text on all `<img>` elements
    - `aria-live="polite"` region in root layout for streaming updates
    - Associate all form inputs with `<label>` via `htmlFor`/`id`
    - _Requirements: 10.4, 10.5, 10.6, 10.10_

  - [ ] 22.3 Implement `Accessibility_Mode` visual changes
    - When `isAccessibilityMode` is true: apply high-contrast Tailwind theme class to `<body>`, set base font size to `18px`
    - Show `GraphAccessibilityTable` in place of (or alongside) visual graph
    - _Requirements: 3.8, 10.8_

  - [ ] 22.4 Add privacy notice on first load
    - Render a banner or section of the `DisclaimerModal` (before the "I Understand" button) explaining: documents processed in-session only, never stored, only extracted text sent to AI model
    - _Requirements: 11.10_

  - [ ] 22.5 Add startup environment variable validation
    - In `app/layout.tsx` server component (or a dedicated `lib/config.ts`), check for `GEMINI_API_KEY` at startup
    - If missing, `console.error` the variable name and `process.exit(1)` (in Node.js startup context) or throw with descriptive message
    - _Requirements: 15.5_

- [ ] 23. Checkpoint — Full Application Working
  - Run full application with two documents; verify all 8 feature tabs, Risk DNA Graph, comparison view, and exports function end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Unit Tests
  - [ ] 24.1 Write unit tests for `src/lib/document/` (target 90% coverage)
    - `documentValidator.test.ts`: test all three validators with valid/invalid inputs; boundary cases (exactly 10 MB, 10 MB + 1 byte)
    - `pdfParser.test.ts`: mock `pdfjs-dist`; verify `ParsedDocument` fields
    - `docxParser.test.ts`: mock `mammoth`; verify text extraction and word count
    - `txtParser.test.ts`: mock `FileReader`; verify encoding handling
    - _Requirements: 14.3_

  - [ ] 24.2 Write unit tests for `src/lib/ai/` (target 95% on ragChunker, 85% on ragRetriever)
    - `ragChunker.test.ts`: empty string, single sentence, very long text (>50k chars), unicode characters
    - `ragRetriever.test.ts`: verify top-K ordering, empty query, no matching chunks
    - `summaryPrompt.test.ts`: verify disclaimer phrase present, section structure in output template
    - `qaPrompt.test.ts`: verify chunk texts injected into prompt string
    - _Requirements: 14.3_

  - [ ] 24.3 Write unit tests for `src/lib/security/` (target 95% coverage)
    - `piiRedactor.test.ts`: each PII pattern in isolation; compound text with multiple PII types
    - `injectionGuard.test.ts`: each injection pattern; benign legal text should return `isSafe: true`
    - `rateLimiter.test.ts`: under-limit, at-limit, over-limit; window expiration
    - _Requirements: 14.3_

  - [ ] 24.4 Write unit tests for `src/lib/export/` and `src/lib/utils/` (target 80–90%)
    - `tokenCounter.test.ts`: empty string, single word, typical legal paragraph
    - `colorUtils.test.ts`: verify all `RISK_COLOR_MAP` pairs return contrast ratio ≥ 4.5
    - `requestDeduplicator.test.ts`: simultaneous identical calls return same Promise; sequential calls after window get new Promise
    - `clipboardExporter.test.ts`: mock `navigator.clipboard`, verify fallback
    - _Requirements: 14.3_

- [ ] 25. Property-Based Tests
  - [ ] 25.1 Create `__tests__/property/fileValidation.property.test.ts`
    - **Property 1: File type validation rejects non-legal formats** — generate arbitrary extensions with `fc.string()`; assert `validateFileType` returns valid for `.pdf`, `.docx`, `.txt` only
    - **Property 2: Document metadata correctness** — generate arbitrary text strings; assert `wordCount === text.split(/\s+/).filter(Boolean).length`
    - **Validates: Requirements 1.1, 1.7, 1.8**

  - [ ] 25.2 Create `__tests__/property/ragChunker.property.test.ts`
    - **Property 3: Token chunk size invariant** — `fc.string({ minLength: 100, maxLength: 50_000 })`; assert every chunk `tokenCount ≤ 2000` and union covers entire document
    - **Validates: Requirements 12.7**

  - [ ] 25.3 Create `__tests__/property/summaryOutput.property.test.ts`
    - **Property 4: Plain-language summary always contains a disclaimer** — generate mock `SummaryResult` objects; assert `disclaimer` is non-empty and contains "informational purposes only" and "does not constitute legal advice"
    - **Property 5: Summary always has labeled sections** — assert `sections.length > 0` and every element has non-empty `title`
    - **Property 20: All AI outputs include a disclaimer** — cross-cutting test across summary, checklist, next-steps, attorney-pack mock outputs
    - **Validates: Requirements 2.3, 2.5, 13.3**

  - [ ] 25.4 Create `__tests__/property/riskGraph.property.test.ts`
    - **Property 6: Risk node color invariant** — generate `RiskNode[]` with arbitrary `riskLevel`; assert `RISK_COLOR_MAP[riskLevel].bg` matches expected palette for all three levels
    - **Property 7: Risk graph node-per-clause invariant** — generate N clause objects; assert resulting `RiskGraphData` contains exactly N nodes with matching `clauseId`s
    - **Validates: Requirements 3.2, 3.3**

  - [ ] 25.5 Create `__tests__/property/clauseHighlighter.property.test.ts`
    - **Property 8: Clause category set invariant** — generate `HighlightedClause[]`; assert every `category` is a member of the 7 defined `ClauseCategory` values
    - **Property 9: Sidebar grouping count invariant** — group by category and sum counts; assert equals `input.length` and no clause appears in more than one group
    - **Property 21: WCAG contrast ratio invariant** — for each `ClauseCategory`, assert `getContrastRatio(bgColor, textColor) >= 4.5`
    - **Validates: Requirements 5.1, 5.2, 5.4, 10.1**

  - [ ] 25.6 Create `__tests__/property/qaOutput.property.test.ts`
    - **Property 10: RAG prompt always includes retrieved chunks** — generate document text + question; assert `buildQAPrompt()` output contains at least one chunk text substring
    - **Property 11: Q&A successful response always includes confidence score and citation** — generate mock SSE event streams; assert exactly one `confidence` event with score in [0, 100]
    - **Validates: Requirements 6.2, 6.4**

  - [ ] 25.7 Create `__tests__/property/security.property.test.ts`
    - **Property 12: Prompt injection detection rejects known patterns** — for each injection regex, generate matching strings with `fc.string()` + template; assert `checkForInjection` returns `{ isSafe: false }`; generate benign legal text; assert `{ isSafe: true }`
    - **Property 13: PII redaction leaves no raw PII in output** — for each PII pattern, generate matching strings; assert `redactPii(text).redactedText` does not contain original match
    - **Validates: Requirements 6.8, 11.3, 11.7**

  - [ ] 25.8 Create `__tests__/property/nextSteps.property.test.ts`
    - **Property 14: Next steps count is always in [3, 7]** — generate mock `NextStep[]` from pipeline; assert `length >= 3 && length <= 7`
    - **Property 15: Next steps always contains an attorney step and disclaimer** — assert at least one step text contains "attorney" or "lawyer"; assert disclaimer is non-empty
    - **Property 16: Next steps categories are exhaustive and valid** — assert every `step.category` is exactly one of `'Do Now' | 'Do Soon' | 'Optional'`
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5, 13.3**

  - [ ] 25.9 Create `__tests__/property/checklist.property.test.ts`
    - **Property 17: Checklist always has all four required headings** — generate mock `ChecklistData`; assert all 4 heading keys present
    - **Property 18: Checklist items with clause refs include the ref** — generate `ChecklistEntry[]` where clause refs should be present; assert `clauseRef` is non-null and non-empty string
    - **Validates: Requirements 8.2, 8.3**

  - [ ] 25.10 Create `__tests__/property/attorneyPack.property.test.ts`
    - **Property 19: Attorney pack question count is in [8, 15]** — generate mock `AttorneyPackData`; assert `sum(questionsByHeading[h].length) >= 8 && <= 15`
    - **Validates: Requirements 9.2**

- [ ] 26. Checkpoint — All Tests Passing
  - Run `npm run typecheck && npm run lint && npm run test:unit && npm run test:property && npm run test:coverage`
  - Ensure all 80% coverage thresholds pass on `src/lib/`
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 27. Deployment Preparation
  - [ ] 27.1 Create `next.config.js` with:
    - `output: 'standalone'` for Vercel optimization
    - Webpack config to alias `pdfjs-dist` worker
    - `images.domains` if any external image sources used
    - _Requirements: 15.1_

  - [ ] 27.2 Create `vercel.json` with:
    - `functions` config for API routes (set `maxDuration: 30` for AI streaming routes)
    - `headers` config applying CSP, HTTPS-only redirect
    - _Requirements: 15.1_

  - [ ] 27.3 Create `README.md` documenting:
    - Project overview and feature list
    - Setup instructions: `npm install`, `cp .env.example .env.local`, `npm run dev`
    - Required environment variables (names and descriptions only, no values)
    - How to run tests: `npm run test:unit`, `npm run test:property`, `npm run test:coverage`
    - Link to live Vercel deployment
    - Link to GitHub repository
    - _Requirements: 15.2_

  - [ ] 27.4 Add MIT `LICENSE` file to repository root
    - _Requirements: 15.6_

  - [ ] 27.5 Verify repository size is under 10 MB (excluding `node_modules/` and `.next/`)
    - Add comprehensive `.gitignore` if not already present: `.next/`, `node_modules/`, `coverage/`, `.env.local`, `*.env`, `dist/`
    - _Requirements: 15.3_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for full traceability
- The three checkpoints (tasks 9, 18, 23, 26) are integration verification gates — do not skip them
- Property tests in tasks 25.1–25.10 cover all 21 correctness properties defined in design.md
- The Risk DNA Graph (task 19) uses React Flow + dagre for layout and `html2canvas` for PNG export — both are lazy-loaded to protect Lighthouse scores
- `geminiClient.ts` must never be imported in client components; use the `'server-only'` guard
- All AI outputs must have a `DisclaimerBadge` appended — enforced by Property 20 test
- Session cache (`sessionStorage`) is checked on every feature tab activation before triggering a new API call (Req 12.5)
- PII redaction happens server-side on every API route, not just on some — defense-in-depth
- The `useStreamingResponse` hook handles deduplication and retry automatically; feature panels do not need custom retry logic

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 1, "tasks": ["3.1", "4.1", "4.2", "4.3"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4", "5.1", "5.2", "5.3", "5.4"] },
    { "id": 3, "tasks": ["5.5", "6.1", "7.3", "7.4"] },
    { "id": 4, "tasks": ["6.2", "6.3", "6.4", "7.1", "7.2", "7.5"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7"] },
    { "id": 6, "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5", "10.6", "10.7", "10.8", "10.9"] },
    { "id": 7, "tasks": ["11.1", "11.2", "11.3"] },
    { "id": 8, "tasks": ["12.1", "12.2", "13.1", "13.2", "13.3", "13.4", "14.1", "14.2", "14.3"] },
    { "id": 9, "tasks": ["15.1", "15.2", "16", "17"] },
    { "id": 10, "tasks": ["19.1", "19.2", "19.3", "19.4", "19.5", "20.1", "20.2", "21.1", "21.2"] },
    { "id": 11, "tasks": ["19.6", "19.7", "20.3"] },
    { "id": 12, "tasks": ["22.1", "22.2", "22.3", "22.4", "22.5"] },
    { "id": 13, "tasks": ["24.1", "24.2", "24.3", "24.4"] },
    { "id": 14, "tasks": ["25.1", "25.2", "25.3", "25.4", "25.5", "25.6", "25.7", "25.8", "25.9", "25.10"] },
    { "id": 15, "tasks": ["27.1", "27.2", "27.3", "27.4", "27.5"] }
  ]
}
```

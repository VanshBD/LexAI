/**
 * Shared type definitions used across multiple LexAI features.
 *
 * Imports `RiskLevel` from `./graph` to avoid duplication and ensure
 * highlighted clauses use the same risk classification as the Risk DNA Graph.
 */

import type { RiskLevel } from './graph';

// ---------------------------------------------------------------------------
// FeatureTab
// ---------------------------------------------------------------------------

/**
 * Union of valid tab identifiers for the main feature navigation in the LexAI UI.
 *
 * - `'summary'`       — AI-generated document summary panel.
 * - `'risk-graph'`    — Interactive Legal Risk DNA Graph (React Flow).
 * - `'comparison'`    — Side-by-side document comparison view (requires 2 uploads).
 * - `'clauses'`       — Highlighted clause viewer with risk sidebar.
 * - `'qa'`            — RAG-powered document Q&A chat.
 * - `'checklist'`     — AI-generated review checklist with toggleable items.
 * - `'next-steps'`    — Recommended actions categorized by urgency.
 * - `'attorney-pack'` — Curated questions for an attorney consultation.
 */
export type FeatureTab =
  | 'summary'
  | 'risk-graph'
  | 'comparison'
  | 'clauses'
  | 'qa'
  | 'checklist'
  | 'next-steps'
  | 'attorney-pack';

// ---------------------------------------------------------------------------
// ClauseCategory
// ---------------------------------------------------------------------------

/**
 * Semantic category assigned to a highlighted clause, used for color-coding
 * and filtering in the `ClauseSidebar`.
 *
 * - `'obligations'`              — Duties the signer must perform.
 * - `'rights'`                   — Entitlements or protections granted to the signer.
 * - `'limitations-of-liability'` — Caps or exclusions on the parties' legal exposure.
 * - `'termination'`              — Conditions under which the agreement may end.
 * - `'indemnification'`          — Clauses requiring one party to cover the other's losses.
 * - `'jurisdiction'`             — Governing law and dispute resolution venue.
 * - `'unusual-or-one-sided'`     — Clauses flagged as atypical or heavily favoring one party.
 */
export type ClauseCategory =
  | 'obligations'
  | 'rights'
  | 'limitations-of-liability'
  | 'termination'
  | 'indemnification'
  | 'jurisdiction'
  | 'unusual-or-one-sided';

// ---------------------------------------------------------------------------
// HighlightedClause
// ---------------------------------------------------------------------------

/**
 * A clause extracted from a document and flagged for highlighting in the `DocumentViewer`.
 *
 * Offsets reference character positions within the parent document's `text` field,
 * enabling precise in-document highlight rendering.
 *
 * @property id          - Unique clause identifier (matches the corresponding `ClauseNodeData.clauseId` if graphed).
 * @property text        - The exact clause text as it appears in the document.
 * @property startOffset - Character offset (inclusive) where the clause begins in the document text.
 * @property endOffset   - Character offset (exclusive) where the clause ends in the document text.
 * @property category    - Semantic category used for sidebar grouping and highlight color.
 * @property riskLevel   - Risk severity shared with the Risk DNA Graph for consistent color coding.
 * @property summary     - Plain-language AI-generated summary of this clause.
 * @property isUnfair    - `true` when the clause is flagged as unusual or one-sided.
 */
export interface HighlightedClause {
  /** Unique clause identifier. Matches `ClauseNodeData.clauseId` when the clause also appears in the Risk DNA Graph. */
  id: string;
  /** The exact clause text as extracted from the document. */
  text: string;
  /** Character offset (inclusive) of the clause's start position in the document's plain text. */
  startOffset: number;
  /** Character offset (exclusive) of the clause's end position in the document's plain text. */
  endOffset: number;
  /** Semantic category determining the highlight color and sidebar grouping. */
  category: ClauseCategory;
  /** Risk severity level, consistent with the Risk DNA Graph color scheme. */
  riskLevel: RiskLevel;
  /** Plain-language AI-generated summary of what this clause means for the signer. */
  summary: string;
  /** `true` when the clause is categorized as `'unusual-or-one-sided'`. */
  isUnfair?: boolean;
}

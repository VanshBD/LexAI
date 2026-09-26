/**
 * Type definitions for the Legal Risk DNA Graph feature.
 *
 * Covers the graph data model used by the React Flow visualization,
 * including clause nodes, risk edges, and the top-level graph data container.
 */

// ---------------------------------------------------------------------------
// RiskLevel
// ---------------------------------------------------------------------------

/**
 * The assessed risk severity of a legal clause.
 *
 * - `'critical'` — High-risk clause requiring immediate attention before signing.
 * - `'moderate'` — Clause with potential concerns that should be reviewed.
 * - `'low'`      — Standard clause with minimal risk.
 */
export type RiskLevel = 'critical' | 'moderate' | 'low';

// ---------------------------------------------------------------------------
// ClauseNodeData
// ---------------------------------------------------------------------------

/**
 * Data payload attached to each clause node in the Risk DNA Graph.
 *
 * @property clauseId       - Unique identifier for the clause within the document.
 * @property title          - Short human-readable title for the clause (e.g., "Indemnification").
 * @property shortText      - First 120 characters of the clause text, used in the node preview.
 * @property fullText       - Complete original clause text.
 * @property riskLevel      - Assessed risk severity of this clause.
 * @property riskReason     - AI-generated explanation of why this risk level was assigned.
 * @property plainSummary   - Plain-language summary of the clause for non-lawyer users.
 * @property documentIndex  - Which uploaded document slot this clause belongs to (0 = first, 1 = second).
 */
export interface ClauseNodeData {
  /** Unique identifier for the clause within the document. */
  clauseId: string;
  /** Short human-readable title for the clause (e.g., "Indemnification"). */
  title: string;
  /** First 120 characters of the clause text, used as a preview in the graph node. */
  shortText: string;
  /** Complete original clause text. */
  fullText: string;
  /** Assessed risk severity of this clause. */
  riskLevel: RiskLevel;
  /** AI-generated explanation of why this risk level was assigned. */
  riskReason: string;
  /** Plain-language summary of the clause suitable for non-lawyer users. */
  plainSummary: string;
  /** Which uploaded document slot this clause belongs to. 0 = first document, 1 = second document. */
  documentIndex: 0 | 1;
}

// ---------------------------------------------------------------------------
// RiskNode
// ---------------------------------------------------------------------------

/**
 * A React Flow node representing a legal clause in the Risk DNA Graph.
 *
 * The `type` field MUST be the literal string `'clauseNode'` so React Flow
 * routes rendering to the custom `ClauseNode` component.
 *
 * @property id       - Unique node identifier (matches `data.clauseId`).
 * @property type     - Must be the literal `'clauseNode'`.
 * @property position - Absolute `{ x, y }` coordinates computed by the dagre layout algorithm.
 * @property data     - Clause-specific data payload rendered by the custom node component.
 */
export interface RiskNode {
  /** Unique node identifier — matches the corresponding `ClauseNodeData.clauseId`. */
  id: string;
  /** React Flow node type. MUST be the literal string `'clauseNode'`. */
  type: 'clauseNode';
  /** Absolute canvas position computed by the dagre layout algorithm. */
  position: { x: number; y: number };
  /** Clause data rendered by the `ClauseNode` custom component. */
  data: ClauseNodeData;
}

// ---------------------------------------------------------------------------
// RiskEdge
// ---------------------------------------------------------------------------

/**
 * A React Flow edge representing a relationship between two clauses in the Risk DNA Graph.
 *
 * @property id       - Unique edge identifier, typically `"${source}-${target}"`.
 * @property source   - ID of the source `RiskNode`.
 * @property target   - ID of the target `RiskNode`.
 * @property type     - Visual style: `'default'` for standard relationships, `'conflict'` for contradictions (rendered in purple).
 * @property label    - Optional human-readable label describing the relationship.
 * @property animated - When `true`, the edge is rendered with a flowing animation to draw attention.
 */
export interface RiskEdge {
  /** Unique edge identifier, typically formatted as `"${sourceId}-${targetId}"`. */
  id: string;
  /** ID of the source `RiskNode`. */
  source: string;
  /** ID of the target `RiskNode`. */
  target: string;
  /** Edge visual style. `'conflict'` edges are rendered in violet (#7C3AED) in comparison mode. */
  type: 'default' | 'conflict';
  /** Optional human-readable label describing the nature of the relationship. */
  label?: string;
  /** When `true`, the edge animates with a flowing dash to indicate active conflict or high importance. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// RiskGraphData
// ---------------------------------------------------------------------------

/**
 * The complete data payload returned by the `/api/risk-graph` route and stored in the Zustand session store.
 *
 * @property nodes       - All clause nodes to render in the graph.
 * @property edges       - All edges connecting related clauses.
 * @property documentId  - ID of the primary document this graph was generated for.
 * @property generatedAt - Unix timestamp (ms) when the graph was generated (from `Date.now()`).
 */
export interface RiskGraphData {
  /** All clause nodes to render in the Risk DNA Graph. */
  nodes: RiskNode[];
  /** All directed edges connecting related or conflicting clauses. */
  edges: RiskEdge[];
  /** ID of the primary document this graph was generated for. */
  documentId: string;
  /** Unix timestamp (milliseconds) recorded when the graph was generated. */
  generatedAt: number;
}

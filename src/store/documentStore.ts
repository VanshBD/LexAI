import { create } from 'zustand';
import type { ParsedDocument, DocumentError } from '@/types/document';
import type { RiskGraphData } from '@/types/graph';
import type { SummaryResult, QAMessage, NextStep, ComparisonResult, AttorneyPackData } from '@/types/ai';
import type { ChecklistData } from '@/types/checklist';
import type { HighlightedClause, FeatureTab } from '@/types/common';

// TextChunk interface (defined inline here; ragChunker.ts will re-export this same shape)
export interface TextChunk {
  chunkId: string;
  startOffset: number;
  endOffset: number;
  tokenCount: number;
  text: string;
}

// Suppress unused-import warning — DocumentError is part of the public surface but not
// directly referenced in the store state shape.
type _DocumentError = DocumentError;

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

const initialState = {
  documents: [null, null] as [ParsedDocument | null, ParsedDocument | null],
  chunks: [[], []] as [TextChunk[], TextChunk[]],
  summaries: [null, null] as [SummaryResult | null, SummaryResult | null],
  riskGraphs: [null, null] as [RiskGraphData | null, RiskGraphData | null],
  comparisonResult: null as ComparisonResult | null,
  highlightedClauses: [[], []] as [HighlightedClause[], HighlightedClause[]],
  qaHistory: [] as QAMessage[],
  checklist: [null, null] as [ChecklistData | null, ChecklistData | null],
  nextSteps: null as NextStep[] | null,
  attorneyPack: null as AttorneyPackData | null,
  activeTab: 'summary' as FeatureTab,
  isAccessibilityMode: false,
  disclaimerAcknowledged: false,
};

export const useDocumentStore = create<DocumentStore>((set) => ({
  ...initialState,

  // ---------------------------------------------------------------------------
  // Document actions
  // ---------------------------------------------------------------------------
  setDocument: (slot, doc) =>
    set((state) => {
      const nextDocs = [...state.documents] as [ParsedDocument | null, ParsedDocument | null];
      nextDocs[slot] = doc;
      const nextSummaries = [...state.summaries] as [SummaryResult | null, SummaryResult | null];
      nextSummaries[slot] = null;
      const nextGraphs = [...state.riskGraphs] as [RiskGraphData | null, RiskGraphData | null];
      nextGraphs[slot] = null;
      const nextClauses = [...state.highlightedClauses] as [HighlightedClause[], HighlightedClause[]];
      nextClauses[slot] = [];
      const nextChecklists = [...state.checklist] as [ChecklistData | null, ChecklistData | null];
      nextChecklists[slot] = null;

      return {
        documents: nextDocs,
        summaries: nextSummaries,
        riskGraphs: nextGraphs,
        highlightedClauses: nextClauses,
        checklist: nextChecklists,
        comparisonResult: null, // Reset comparison on document change so new comparison auto-triggers
      };
    }),

  clearDocument: (slot) =>
    set((state) => {
      const nextDocs = [...state.documents] as [ParsedDocument | null, ParsedDocument | null];
      nextDocs[slot] = null;
      const nextSummaries = [...state.summaries] as [SummaryResult | null, SummaryResult | null];
      nextSummaries[slot] = null;
      const nextGraphs = [...state.riskGraphs] as [RiskGraphData | null, RiskGraphData | null];
      nextGraphs[slot] = null;
      const nextClauses = [...state.highlightedClauses] as [HighlightedClause[], HighlightedClause[]];
      nextClauses[slot] = [];
      const nextChecklists = [...state.checklist] as [ChecklistData | null, ChecklistData | null];
      nextChecklists[slot] = null;

      return {
        documents: nextDocs,
        summaries: nextSummaries,
        riskGraphs: nextGraphs,
        highlightedClauses: nextClauses,
        checklist: nextChecklists,
        comparisonResult: null,
      };
    }),

  // ---------------------------------------------------------------------------
  // Chunk actions
  // ---------------------------------------------------------------------------
  setChunks: (slot, chunks) =>
    set((state) => {
      const next = [...state.chunks] as [TextChunk[], TextChunk[]];
      next[slot] = chunks;
      return { chunks: next };
    }),

  // ---------------------------------------------------------------------------
  // Summary actions
  // ---------------------------------------------------------------------------
  setSummary: (slot, summary) =>
    set((state) => {
      const next = [...state.summaries] as [SummaryResult | null, SummaryResult | null];
      next[slot] = summary;
      return { summaries: next };
    }),

  // ---------------------------------------------------------------------------
  // Risk graph actions
  // ---------------------------------------------------------------------------
  setRiskGraph: (slot, graph) =>
    set((state) => {
      const next = [...state.riskGraphs] as [RiskGraphData | null, RiskGraphData | null];
      next[slot] = graph;
      return { riskGraphs: next };
    }),

  // ---------------------------------------------------------------------------
  // Comparison actions
  // ---------------------------------------------------------------------------
  setComparisonResult: (result) => set({ comparisonResult: result }),

  // ---------------------------------------------------------------------------
  // Highlighted clause actions
  // ---------------------------------------------------------------------------
  setHighlightedClauses: (slot, clauses) =>
    set((state) => {
      const next = [...state.highlightedClauses] as [HighlightedClause[], HighlightedClause[]];
      next[slot] = clauses;
      return { highlightedClauses: next };
    }),

  // ---------------------------------------------------------------------------
  // Q&A actions
  // ---------------------------------------------------------------------------
  addQAMessage: (message) =>
    set((state) => ({ qaHistory: [...state.qaHistory, message] })),

  // ---------------------------------------------------------------------------
  // Checklist actions
  // ---------------------------------------------------------------------------
  setChecklist: (slot, data) =>
    set((state) => {
      const next = [...state.checklist] as [ChecklistData | null, ChecklistData | null];
      next[slot] = data;
      return { checklist: next };
    }),

  toggleChecklistItem: (slot, itemId) =>
    set((state) => {
      const slotData = state.checklist[slot];
      if (!slotData) return {};

      // Deep-clone items map, toggling the matched entry
      const updatedItems = Object.fromEntries(
        Object.entries(slotData.items).map(([heading, entries]) => [
          heading,
          entries.map((entry) =>
            entry.id === itemId ? { ...entry, checked: !entry.checked } : entry,
          ),
        ]),
      ) as ChecklistData['items'];

      const updatedSlotData: ChecklistData = { ...slotData, items: updatedItems };
      const next = [...state.checklist] as [ChecklistData | null, ChecklistData | null];
      next[slot] = updatedSlotData;
      return { checklist: next };
    }),

  // ---------------------------------------------------------------------------
  // Next-steps actions
  // ---------------------------------------------------------------------------
  setNextSteps: (steps) => set({ nextSteps: steps }),

  // ---------------------------------------------------------------------------
  // Attorney-pack actions
  // ---------------------------------------------------------------------------
  setAttorneyPack: (data) => set({ attorneyPack: data }),

  // ---------------------------------------------------------------------------
  // UI state actions
  // ---------------------------------------------------------------------------
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleAccessibilityMode: () =>
    set((state) => ({ isAccessibilityMode: !state.isAccessibilityMode })),
  acknowledgeDisclaimer: () => set({ disclaimerAcknowledged: true }),

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------
  clearAll: () => set({ ...initialState }),
}));

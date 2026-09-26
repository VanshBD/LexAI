# LexAI — GenAI Legal Intelligence Assistant

[![Built for GDG HackToSkill 2026](https://img.shields.io/badge/Competition-GDG%20HackToSkill%202026-indigo.svg)](https://hacktoskill.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue.svg)](tsconfig.json)

**LexAI** is a production-grade GenAI legal assistant built for the **Google GDG HackToSkill Competition 2026**. It demystifies complex legal documents, highlights risks, visualizes clause relationships, and helps non-lawyers prepare for professional consultations — with **zero server-side document storage** and end-to-end privacy guarantees.

---

## 🎯 Problem Statement & Key Features

LexAI delivers all 7 essential legal intelligence use cases:

1. **Plain-Language Document Summary** (Flesch-Kincaid Grade ≤ 8)
   - Translates complex legalese into clear, accessible sections.
   - Built with `gemini-1.5-flash` for sub-second streaming.
2. **Interactive Legal Risk DNA Graph**
   - Interactive React Flow graph with automatic topological dagre layout.
   - Nodes categorized as Critical (red), Moderate (amber), or Low/Standard (green) risk.
   - Conflict edges rendered in violet (#7C3AED).
3. **In-Document Clause Highlighting & Sidebar Filter**
   - In-situ text highlighting with WCAG 2.1 AA compliant contrast ratios.
   - Semantic grouping: obligations, rights, termination, indemnity, and unfair/one-sided clauses.
4. **Document Q&A with Grounded Confidence Scoring**
   - Ask any natural language question about uploaded agreements.
   - BM25 client-side RAG chunk retrieval with exact clause citation markers and confidence % ratings.
5. **Interactive Review Checklist**
   - Auto-extracts "Your Obligations", "Your Rights", "Important Deadlines", and "Actions Before Signing".
   - Interactive checkbox tracking with 1-click clipboard copy and PDF export.
6. **Prioritized Action Plan & Next Steps**
   - Categorized by urgency: *Do Now* (≤7 days), *Do Soon* (≤30 days), or *Optional*.
   - Highlights explicit deadlines extracted from the document.
7. **Attorney Preparation Pack**
   - Generates 8–15 targeted, document-specific consultation questions.
   - Grouped into: Understanding Rights, Clarifying Obligations, Identifying Risks, Before Signing.
8. **Side-by-Side Document Comparison**
   - Compares two uploaded documents simultaneously.
   - Synchronized scrolling, discrepancy counts, and conflict highlighting.

---

## 🔒 Security & Privacy Architecture

- **Zero Server-Side Storage**: Documents reside strictly in client-side in-memory Zustand store and ephemeral sessionStorage.
- **Client-Side Parsing**: PDFs (`pdfjs-dist`), Word Docs (`mammoth`), and Text files parse locally in the user's browser.
- **7-Pattern PII Redaction**: SSNs, phone numbers, emails, physical addresses, ZIP codes, and ID numbers are sanitized on the server before transmitting prompts to Gemini.
- **7-Pattern Prompt Injection Guard**: Inspects user prompts and text for jailbreak/override signatures.
- **Content Security Policy (CSP)** & **Sliding Window Rate Limiter**: 20 requests/minute per IP.

---

## 🛠️ Tech Stack & GenAI Architecture

| Component | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 14 App Router | React Server Components + SSE Streaming |
| **Language** | TypeScript (Strict Mode) | Zero compiler errors, 100% type safety |
| **Styling** | Tailwind CSS + WCAG AA | High-contrast accessibility mode + 18px font mode |
| **GenAI (Fast Tasks)** | Google Gemini 1.5 Flash | Summaries, Q&A, Checklist, Next Steps, Attorney Pack |
| **GenAI (Complex Reasoning)**| Google Gemini 1.5 Pro | Risk DNA Graph, Clause Relationship Extraction, Comparisons |
| **Graph Visualization** | React Flow + dagre | Dynamic DAG layout, lazy-loaded with SSR disabled |
| **Export Engines** | jsPDF + html2canvas | PDF, TXT, and PNG graph downloads |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone repository:
   ```bash
   git clone <repo-url>
   cd AI-Legal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Run Development Server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Testing Commands

```bash
# Verify TypeScript strict compilation (0 errors)
npm run typecheck

# Run unit test suite
npm run test:unit

# Run property-based tests (fast-check)
npm run test:property

# Generate test coverage report (≥80% on src/lib/)
npm run test:coverage

# Build for production
npm run build
```

---

## ⚖️ Legal Disclaimer

LexAI provides information and document analysis only. LexAI does **not** provide legal advice, legal representation, or formal legal opinions. No attorney-client relationship is created by using this application. Users should always consult a licensed attorney for specific legal questions or before signing binding agreements.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

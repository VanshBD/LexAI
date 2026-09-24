# Requirements Document

## Introduction

LexAI is a GenAI-powered legal assistant web application that makes legal information accessible, understandable, and actionable for everyday users without replacing professional legal counsel. Built for the Google GDG HackToSkill competition, LexAI differentiates itself through a unique "Legal Risk DNA" visualization — an interactive, dynamic risk graph that maps clause relationships and highlights danger zones across uploaded documents in real time. The application processes legal documents entirely in-session (no server-side storage), streams AI responses token-by-token for a transparent and trustworthy experience, and guides users step-by-step from document confusion to a prepared list of questions for their attorney.

The system uses the Gemini API for all generative AI capabilities and is deployed on Vercel with a Next.js frontend. It targets WCAG 2.1 AA accessibility, achieves sub-3-second time-to-first-token on AI responses, and keeps the repository under 10 MB.

---

## Glossary

- **LexAI**: The application being built; the system under specification.
- **Document**: Any uploaded legal file (PDF, DOCX, or plain text) provided by the user within a session.
- **Session**: A single browser session. No data persists beyond the session unless explicitly exported by the user.
- **Gemini_API**: Google's Gemini generative AI API used for all language model inference.
- **Risk_DNA_Graph**: LexAI's unique, interactive visualization that maps clauses across documents as nodes, connecting related clauses with edges and color-coding them by risk level (critical, moderate, low).
- **Clause**: A discrete section or provision within a legal Document.
- **Plain_Language_Summary**: A restatement of legal text in language accessible to a non-lawyer adult reader (Flesch-Kincaid grade level ≤ 8).
- **Checklist**: A structured, exportable list of action items derived from a Document's obligations or risks.
- **Attorney_Question_Pack**: A generated, downloadable set of questions a user can bring to a legal professional based on the Document's content.
- **Streamed_Response**: An AI response delivered incrementally token-by-token via server-sent events, so users see output appear in real time.
- **RAG**: Retrieval-Augmented Generation — answering user questions by retrieving relevant document chunks and passing them as context to the Gemini_API.
- **Disclaimer**: A clearly visible notice that LexAI provides legal information, not legal advice, and does not replace a licensed attorney.
- **Accessibility_Mode**: A toggle that activates enhanced contrast, larger text, and keyboard-only navigation support.
- **Export**: Saving AI-generated output as a PDF or plain-text file to the user's local device.
- **Comparison_View**: A side-by-side interface rendering two Documents with differences, risks, and clause conflicts highlighted inline.
- **Confidence_Score**: A 0–100 percentage the Gemini_API assigns to each AI-generated answer indicating the model's certainty given the provided document context.
- **PII**: Personally Identifiable Information (names, addresses, ID numbers) found within uploaded Documents.
- **Sanitized_Prompt**: A prompt sent to the Gemini_API from which PII has been redacted or replaced with placeholders before transmission.

---

## Requirements

---

### Requirement 1: Document Ingestion and Session-Only Storage

**User Story:** As a user, I want to upload my legal documents and have them processed entirely within my browser session, so that my sensitive legal information is never stored on a server.

#### Acceptance Criteria

1. THE LexAI SHALL accept file uploads in PDF, DOCX, and plain-text (.txt) formats.
2. WHEN a user uploads a Document, THE LexAI SHALL parse and extract the full text client-side before transmitting only the extracted text (not the raw file) to the Gemini_API.
3. THE LexAI SHALL enforce a maximum file size of 10 MB per Document upload.
4. WHEN a user uploads a file exceeding 10 MB, THE LexAI SHALL display an error message specifying the file size limit and reject the upload without processing.
5. THE LexAI SHALL support uploading a maximum of two Documents simultaneously for comparison features.
6. WHEN a browser session ends or the user navigates away, THE LexAI SHALL discard all Document text and AI-generated outputs from memory without persisting them to any server-side storage.
7. IF a file format is unsupported, THEN THE LexAI SHALL display a clear error message listing the accepted formats (PDF, DOCX, TXT) and prompt the user to re-upload.
8. WHEN a Document is successfully parsed, THE LexAI SHALL display the Document name, page count (for PDFs), and word count to confirm successful ingestion; IF parsing fails, THEN THE LexAI SHALL display no metadata (name, page count, and word count all withheld) until parsing completes successfully.

---

### Requirement 2: Plain-Language Document Simplification

**User Story:** As a user with no legal background, I want complex legal documents translated into plain language, so that I can understand what I am agreeing to or signing.

#### Acceptance Criteria

1. WHEN a Document is uploaded, THE LexAI SHALL generate a Plain_Language_Summary for the entire document using the Gemini_API.
2. THE Plain_Language_Summary SHALL be delivered as a Streamed_Response, with tokens appearing in the UI within 3 seconds of the user triggering the summary action.
3. THE LexAI SHALL structure the Plain_Language_Summary into labeled sections that mirror the Document's own section structure.
4. THE LexAI SHALL target a Flesch-Kincaid reading grade level of 8 or below for all generated Plain_Language_Summary text; WHEN a generated summary is measured to exceed this target, THE LexAI SHALL deliver the summary to the user as-is without regeneration or warning.
5. THE LexAI SHALL append a Disclaimer to every Plain_Language_Summary stating that the summary is for informational purposes only and does not constitute legal advice.
6. WHEN a Plain_Language_Summary is complete, THE LexAI SHALL offer the user an Export option to download the summary as a PDF or plain-text file.
7. IF the Gemini_API returns an error during summary generation, THEN THE LexAI SHALL display a user-readable error message and offer a retry option without requiring the user to re-upload the Document.

---

### Requirement 3: Risk DNA Graph — Unique Innovation Feature

**User Story:** As a user, I want to see an interactive visual map of the risks and relationships between clauses in my document, so that I can immediately understand the danger zones without reading every line.

#### Acceptance Criteria

1. WHEN a Plain_Language_Summary is generated for a Document, THE LexAI SHALL also generate a Risk_DNA_Graph for that Document.
2. THE Risk_DNA_Graph SHALL represent each identified Clause as a node, with edges connecting clauses that reference, depend on, or conflict with each other.
3. THE LexAI SHALL color-code Risk_DNA_Graph nodes using three levels: red for critical risk, amber for moderate risk, and green for low risk, based on the Gemini_API's clause risk assessment.
4. WHEN a user clicks a Risk_DNA_Graph node, THE LexAI SHALL display a panel showing the original Clause text, its Plain_Language_Summary, its risk level, and the reasoning for that risk level.
5. THE Risk_DNA_Graph SHALL be rendered as an interactive SVG or canvas element that supports panning and zooming.
6. WHEN two Documents are loaded for comparison, THE LexAI SHALL require that a Risk_DNA_Graph has already been generated for both Documents before activating the Comparison_View; IF either graph is missing, THEN THE LexAI SHALL display a message directing the user to generate the missing graph before proceeding.
6a. WHEN both Risk_DNA_Graphs exist and the Comparison_View is activated, THE Risk_DNA_Graph SHALL display both documents' clause graphs side-by-side and draw conflict edges in purple between clauses from different documents that contradict each other.
7. THE Risk_DNA_Graph SHALL include a legend explaining the color coding (red, amber, green, purple) and node/edge types, visible without scrolling.
8. WHERE a user activates Accessibility_Mode, THE LexAI SHALL provide a text-based table alternative to the Risk_DNA_Graph listing all clauses with their risk levels and relationships.
9. WHEN the Risk_DNA_Graph is fully rendered, THE LexAI SHALL allow the user to Export it as a PNG image.

---

### Requirement 4: Side-by-Side Contract Comparison

**User Story:** As a user, I want to compare two legal documents side-by-side, so that I can quickly identify differences, conflicts, and missing protections between them.

#### Acceptance Criteria

1. WHEN two Documents are uploaded, THE LexAI SHALL activate the Comparison_View, rendering both documents in adjacent scrollable panels.
2. THE LexAI SHALL synchronize vertical scrolling between the two panels so that corresponding sections remain aligned while the user scrolls.
3. WHEN the Gemini_API identifies a Clause that exists in one Document but not the other, THE LexAI SHALL highlight that Clause with a yellow background and label it "Missing in [Document Name]".
4. WHEN the Gemini_API identifies two Clauses from different Documents that conflict with each other, THE LexAI SHALL highlight both clauses in red and display a conflict summary tooltip.
5. THE Comparison_View SHALL include a summary panel listing all detected differences, conflicts, and missing clauses as a navigable list, so the user can jump directly to each item.
6. WHEN the comparison analysis is complete, THE LexAI SHALL display the total count of differences, conflicts, and missing clauses in a results header.
7. THE LexAI SHALL deliver the comparison analysis as a Streamed_Response, progressively revealing findings as they are generated.
8. WHEN the comparison analysis is complete, THE LexAI SHALL perform a finalization step (compiling the full comparison report) before offering an Export option; WHEN finalization is complete, THE LexAI SHALL offer the Export option to download the full comparison report as a PDF.

---

### Requirement 5: Clause Highlighting and Risk Identification

**User Story:** As a user, I want the most important, risky, or unusual clauses flagged automatically, so that I know exactly which parts of the document deserve my closest attention.

#### Acceptance Criteria

1. WHEN a Document is processed, THE LexAI SHALL identify and highlight clauses in the categories: obligations, rights, limitations-of-liability, termination, indemnification, jurisdiction, and unusual-or-one-sided terms.
2. THE LexAI SHALL render highlighted Clauses with distinct, accessible color coding — each category having a unique background color that meets WCAG 2.1 AA contrast ratio (minimum 4.5:1 against the text color).
3. WHEN a user hovers over or focuses on a highlighted Clause, THE LexAI SHALL display a tooltip showing the clause category, a one-sentence Plain_Language_Summary, and the associated risk level.
4. THE LexAI SHALL display a categorized sidebar listing all highlighted clauses grouped by category, with the count per category shown.
5. WHEN a user clicks a clause in the sidebar, THE LexAI SHALL scroll the document view to that Clause and apply a focus ring visible to keyboard and mouse users.
6. IF the Gemini_API identifies a Clause as potentially unfair or one-sided based on common legal standards, THEN THE LexAI SHALL flag it with a warning icon and explain why in the tooltip.
7. THE LexAI SHALL display the total count of flagged clauses by risk level (critical, moderate, low) in a summary header above the document view.

---

### Requirement 6: Document Q&A with RAG

**User Story:** As a user, I want to ask specific questions about my document and receive accurate answers grounded in the document's actual content, so that I can clarify specific terms or obligations without reading everything.

#### Acceptance Criteria

1. WHEN a Document is uploaded, THE LexAI SHALL enable a Q&A input field where the user can type natural-language questions about the Document.
2. WHEN a user submits a question, THE LexAI SHALL retrieve the most relevant Clause chunks from the Document using semantic chunking and pass them as context in the Gemini_API prompt (RAG pattern).
3. THE LexAI SHALL deliver Q&A answers as Streamed_Responses, with the first token appearing within 3 seconds of question submission.
4. WHEN an answer is successfully generated, THE LexAI SHALL display a Confidence_Score alongside the answer and cite the specific Clause or section the answer is derived from; WHEN no answer is generated (due to an error or unanswerable question), THE LexAI SHALL suppress both the Confidence_Score and the clause citation.
5. WHEN a Confidence_Score is below 60, THE LexAI SHALL display a notice stating "This answer has low confidence — please verify with the original document or a legal professional."
6. THE LexAI SHALL maintain a conversation history within the session so that follow-up questions can reference previous answers.
7. IF a user asks a question that cannot be answered from the Document's content, THEN THE LexAI SHALL respond stating it cannot find relevant information in the provided document, rather than generating an answer from general knowledge.
8. THE LexAI SHALL prevent prompt injection by validating that Q&A inputs do not contain instruction-override patterns before forwarding them to the Gemini_API.

---

### Requirement 7: Next Steps and Options Guidance

**User Story:** As a user, I want the app to help me understand my options and realistic next steps after reviewing my document, so that I know what actions to take.

#### Acceptance Criteria

1. WHEN a Plain_Language_Summary is complete, THE LexAI SHALL generate a "Next Steps" section that outlines 3–7 concrete, actionable options the user may consider based on the document's content.
2. THE Next Steps section SHALL include at least one option recommending consultation with a licensed attorney when the document involves significant legal obligations or risks.
3. THE LexAI SHALL categorize each next step as "Do Now", "Do Soon", or "Optional" to help the user prioritize actions.
4. WHEN a next step involves a time-sensitive obligation detected in the Document, THE LexAI SHALL flag it with a clock icon; WHEN a deadline date is extractable from the Document, THE LexAI SHALL display that deadline date regardless of whether the detection flag is active, omitting only the clock icon when detection has not fired.
5. THE LexAI SHALL append a Disclaimer to the Next Steps section confirming these are informational suggestions and not legal advice.
6. WHEN next steps are generated, THE LexAI SHALL offer the user an Export option to download them as part of a combined output package.

---

### Requirement 8: Checklist and Actionable Output Generation

**User Story:** As a user, I want a downloadable checklist of my obligations and actions from the document, so that I have a practical reference I can act on immediately.

#### Acceptance Criteria

1. WHEN a Document is processed, THE LexAI SHALL generate a Checklist of all user obligations, deadlines, required actions, and rights identified in the Document.
2. THE Checklist SHALL be structured with checkbox items grouped under headings: "Your Obligations", "Your Rights", "Important Deadlines", and "Actions Required Before Signing".
3. WHEN a Checklist item corresponds to a specific Clause, THE LexAI SHALL include a reference to the clause number or section title next to the item; WHEN a Checklist item does not correspond to any specific clause, THE LexAI SHALL include the item in the Checklist without a clause reference.
4. THE LexAI SHALL render the Checklist as an interactive UI component where users can check off completed items within the session.
5. WHEN a user exports the Checklist, THE LexAI SHALL generate a PDF that preserves the checkbox state at the time of export.
6. THE LexAI SHALL offer a "Copy to Clipboard" option for the Checklist in plain text format, producing output within 500 milliseconds of the user's action.

---

### Requirement 9: Attorney Question Pack Generation

**User Story:** As a user preparing to meet a lawyer, I want a pre-generated set of targeted questions based on my document, so that I can make the most of my consultation time.

#### Acceptance Criteria

1. WHEN a Document is processed, THE LexAI SHALL offer an "Prepare for My Attorney" action that generates an Attorney_Question_Pack.
2. WHEN the Attorney_Question_Pack has been generated (per AC1), THE Attorney_Question_Pack SHALL contain 8–15 questions tailored specifically to the risks, ambiguities, unusual clauses, and obligations identified in the uploaded Document.
3. THE LexAI SHALL group questions in the Attorney_Question_Pack under headings: "Understanding Your Rights", "Clarifying Your Obligations", "Identifying Risks", and "Before You Sign".
4. WHEN generating questions, THE LexAI SHALL avoid generic legal questions and ensure every question references a specific element from the Document.
5. THE LexAI SHALL offer the Attorney_Question_Pack as an Export option in PDF and plain-text formats.
6. WHEN the Attorney_Question_Pack is displayed, THE LexAI SHALL include a Disclaimer that these questions are starting points and the user's attorney may identify additional relevant issues.

---

### Requirement 10: Accessibility — WCAG 2.1 AA Compliance

**User Story:** As a user with visual, motor, or cognitive disabilities, I want the application to be fully accessible, so that I can use all features without barriers.

#### Acceptance Criteria

1. THE LexAI SHALL achieve WCAG 2.1 Level AA compliance across all pages and interactive components.
2. THE LexAI SHALL provide keyboard navigation support for all interactive elements, including document upload, Q&A input, Risk_DNA_Graph nodes, and Export buttons.
3. WHEN a user navigates to any interactive element using the keyboard, THE LexAI SHALL display a visible focus indicator with a minimum contrast ratio of 3:1 against the surrounding background.
4. THE LexAI SHALL provide descriptive ARIA labels for all non-text elements, including Risk_DNA_Graph nodes, icons, and status indicators.
5. THE LexAI SHALL provide alternative text for all images and visual-only content.
6. WHEN Streamed_Response text is being generated, THE LexAI SHALL announce updates to screen reader users via an ARIA live region without interrupting ongoing announcements.
7. THE LexAI SHALL support text resizing up to 200% without loss of functionality or content overflow.
8. WHERE a user activates Accessibility_Mode, THE LexAI SHALL switch to a high-contrast color theme and increase base font size to a minimum of 18px.
9. THE LexAI SHALL not use color as the sole means of conveying information; all color-coded risk indicators SHALL also include text labels or icons.
10. THE LexAI SHALL ensure all form inputs include visible labels that are programmatically associated via the `for`/`id` attribute pair or ARIA.

---

### Requirement 11: Security and Privacy

**User Story:** As a user uploading sensitive legal documents, I want assurance that my data is protected and never stored or misused, so that I can use the application with confidence.

#### Acceptance Criteria

1. THE LexAI SHALL transmit all data between the client and backend exclusively over HTTPS.
2. THE LexAI SHALL store Gemini_API keys exclusively in server-side environment variables and SHALL NOT expose them to the client-side JavaScript bundle.
3. WHEN constructing a Gemini_API prompt, THE LexAI SHALL apply PII detection and replace identified PII (names, addresses, ID numbers) with typed placeholders (e.g., [PERSON_NAME], [ADDRESS]) before transmission, preserving legal structure without transmitting raw personal data.
4. THE LexAI SHALL implement rate limiting on all API routes, rejecting more than 20 Gemini_API requests per IP address per minute and returning an HTTP 429 response with a Retry-After header.
5. THE LexAI SHALL validate and sanitize all user-provided inputs (file content, Q&A questions, feedback text) on the server side before processing.
6. THE LexAI SHALL implement Content Security Policy (CSP) headers that restrict script execution to same-origin and explicitly whitelisted sources.
7. IF the Gemini_API returns content that includes instruction-override patterns or jailbreak attempts in its response, THEN THE LexAI SHALL discard the response and return a generic error message to the user.
8. THE LexAI SHALL NOT log or persist Document text, Q&A conversations, or generated AI outputs to any database or logging service.
9. WHEN a session ends, THE LexAI SHALL clear all in-memory Document data without requiring explicit user action.
10. THE LexAI SHALL display a privacy notice on first load explaining that documents are processed in-session only, never stored, and that only extracted text (not raw files) is sent to the AI model.

---

### Requirement 12: Performance and Efficiency

**User Story:** As a user, I want the application to respond quickly and not waste my time, so that I can get answers efficiently even on a typical internet connection.

#### Acceptance Criteria

1. THE LexAI SHALL achieve a Lighthouse Performance score of 85 or above on desktop and 75 or above on mobile for the main application page.
2. WHEN a user triggers any AI generation action, THE LexAI SHALL deliver the first streamed token within 3 seconds under normal network conditions (broadband).
3. THE LexAI SHALL lazy-load the Risk_DNA_Graph visualization library so that the initial page load does not include its bundle weight.
4. THE LexAI SHALL implement request deduplication as a system-wide, always-enabled feature on all API routes, so that duplicate AI requests triggered within 500 milliseconds of each other result in only one Gemini_API call regardless of whether duplicates are currently occurring.
5. THE LexAI SHALL always cache Plain_Language_Summaries and Risk_DNA_Graph data in session storage upon generation; failure to cache constitutes a violation of this requirement regardless of whether a retrigger subsequently occurs.
6. THE LexAI SHALL display a loading skeleton or progress indicator within 200 milliseconds of any AI action being triggered, so users receive immediate feedback.
7. THE LexAI SHALL chunk Document text into segments of no more than 2,000 tokens before passing to the Gemini_API to stay within context limits and enable efficient RAG retrieval.
8. WHEN a user uploads a PDF, THE LexAI SHALL complete client-side text extraction within 5 seconds for files up to 10 MB.

---

### Requirement 13: Disclaimer and Responsible AI Presentation

**User Story:** As a user, I want clear, consistent reminders that LexAI provides information not legal advice, so that I always understand the scope and limitations of the tool.

#### Acceptance Criteria

1. THE LexAI SHALL display a persistent Disclaimer banner in the application footer visible on every page stating: "LexAI provides legal information only, not legal advice. Always consult a licensed attorney for advice specific to your situation."
2. WHEN a user first loads the application, THE LexAI SHALL present a modal Disclaimer requiring explicit acknowledgment (clicking "I Understand") before any Document can be uploaded.
3. THE LexAI SHALL append a contextual Disclaimer to every generated output (Plain_Language_Summary, Checklist, Attorney_Question_Pack, Next Steps, Q&A answers).
4. THE LexAI SHALL include a visible "Find a Lawyer" resource link in the application navigation pointing to a publicly available attorney-finder service.
5. WHEN the Gemini_API generates a response that includes what could be interpreted as direct legal advice (e.g., "You should sign", "This contract is enforceable"), THE LexAI SHALL prepend a disclaimer sentence to the entire response before displaying it to the user.

---

### Requirement 14: Code Quality, Testability, and Maintainability

**User Story:** As a developer and competition evaluator, I want the codebase to be clean, well-structured, and testable, so that it demonstrates professional software engineering standards.

#### Acceptance Criteria

1. THE LexAI SHALL organize its codebase into clearly separated layers: UI components, API route handlers, AI service utilities, document processing utilities, and type definitions.
2. THE LexAI SHALL use TypeScript throughout the codebase with strict mode enabled and zero TypeScript compilation errors.
3. THE LexAI SHALL achieve a minimum of 80% unit test coverage across AI service utilities and document processing utilities.
4. WHEN a Pull Request is created, THE LexAI CI pipeline SHALL automatically run linting (ESLint), type checking, and the unit test suite, blocking merges on any failure.
5. THE LexAI SHALL include JSDoc comments on all exported functions and components describing their purpose, parameters, and return types.
6. THE LexAI SHALL use named exports (not default exports) for all utility functions to support tree-shaking and explicit import tracking.
7. THE LexAI SHALL define all Gemini_API prompt templates as versioned string constants in a dedicated prompts module, not inline in component or handler code.
8. WHEN a new AI feature is added, THE LexAI SHALL include at least one property-based test verifying that the feature's output always contains the required structural elements (e.g., a Plain_Language_Summary always includes a Disclaimer, a Checklist always has at least one item when obligations are present).

---

### Requirement 15: Deployment and Repository Standards

**User Story:** As a competition evaluator, I want to clone the repository, read clear documentation, and see a live deployment, so that I can evaluate the project quickly and fairly.

#### Acceptance Criteria

1. THE LexAI SHALL be deployable to Vercel with a single `vercel deploy` command after setting the required environment variables.
2. THE LexAI repository SHALL include a README.md documenting: project overview, setup instructions, required environment variables, how to run tests locally, and a link to the live deployment.
3. THE LexAI repository SHALL remain under 10 MB total size, excluding `node_modules` and build artifacts tracked in `.gitignore`.
4. THE LexAI SHALL include a `.env.example` file listing all required environment variable names with placeholder values and descriptions, without containing any real secrets.
5. WHEN environment variables are missing at startup, THE LexAI SHALL log a descriptive error message identifying the missing variable names and immediately exit with a non-zero exit code, rather than starting in a broken or degraded state.
6. THE LexAI repository SHALL be publicly accessible on GitHub with a license file (MIT).

'use client';

import React, { useRef, useState } from 'react';
import { ParsedDocument } from '@/types/document';
import { validateFileType, validateFileSize, validateFileCount } from '@/lib/document/documentValidator';
import { parsePdf } from '@/lib/document/pdfParser';
import { parseDocx } from '@/lib/document/docxParser';
import { parseTxt } from '@/lib/document/txtParser';
import { chunkDocument } from '@/lib/ai/ragChunker';
import { useDocumentStore } from '@/store/documentStore';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

interface DocumentUploadProps {
  slot: 0 | 1;
  label?: string;
  isDisabled?: boolean;
}

const SAMPLE_TEXT_A = `SOFTWARE AS A SERVICE (SAAS) AND CONSULTING SERVICES AGREEMENT

This Agreement is entered into on October 1, 2026, by and between CloudCore Inc. ("Provider"), located at 123 Tech Boulevard, San Francisco, CA 94107, and Acme Enterprises LLC ("Customer"), located at 456 Commerce Way, Austin, TX 78701.

1. SCOPE OF SERVICES AND LICENSE
Provider grants Customer a non-exclusive, non-transferable, revocable license to access and use the CloudCore Platform solely for Customer's internal business operations during the term.

2. FEES AND PAYMENT TERMS
Customer shall pay all recurring subscription fees of $5,000 per month within thirty (30) days from invoice date. Any overdue amount shall accrue interest at 1.5% per month or the maximum permitted by law. All fees are non-refundable regardless of early termination.

3. YOUR OBLIGATIONS AND ACCEPTABLE USE
Customer agrees not to reverse engineer, decompile, or copy the software. Customer shall maintain confidentiality of all account credentials and promptly notify Provider within twenty-four (24) hours of any unauthorized access or security breach.

4. CONFIDENTIALITY AND DATA SECURITY
Each party agrees to maintain strict confidentiality of all proprietary information disclosed hereunder. Provider shall implement standard technical measures to protect Customer data. Confidentiality obligations shall survive termination for five (5) years.

5. UNLIMITED INDEMNIFICATION BY CUSTOMER
Customer shall fully defend, indemnify, and hold harmless Provider, its officers, directors, and affiliates against any and all third-party claims, damages, liabilities, costs, and attorney's fees arising out of Customer's use of the Platform or breach of this Agreement, with no monetary cap or limitation.

6. LIMITATION OF LIABILITY
IN NO EVENT SHALL PROVIDER'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED THE TOTAL FEES ACTUALLY PAID BY CUSTOMER IN THE ONE (1) MONTH PRECEDING THE CLAIM. PROVIDER SHALL NOT BE LIABLE FOR ANY CONSEQUENTIAL, INDIRECT, SPECIAL, OR PUNITIVE DAMAGES.

7. TERMINATION AND IMPORTANT DEADLINES
Either party may terminate this Agreement for convenience with sixty (60) days prior written notice. Provider may immediately suspend or terminate access without notice if Customer fails to pay fees within ten (10) days of due date. Upon termination, Customer shall immediately cease all use and return all materials within fifteen (15) days.

8. GOVERNING LAW AND JURISDICTION
This Agreement shall be governed exclusively by the laws of the State of Delaware, without regard to conflict of law principles. Any dispute arising under this Agreement must be brought exclusively in the state or federal courts in Wilmington, Delaware. Customer waives all rights to a jury trial or class action proceeding.

9. ACTIONS REQUIRED BEFORE SIGNING
Customer must verify compliance with local data privacy regulations and ensure IT security protocols align with Provider's API authentication requirements prior to execution.`;

const SAMPLE_TEXT_B = `REVISED ENTERPRISE CLOUD SERVICES AGREEMENT

This Agreement is made on October 1, 2026, between CloudCore Inc. ("Provider"), located in San Francisco, CA, and Acme Enterprises LLC ("Customer"), located in Austin, TX.

1. SCOPE OF SERVICES AND EXPANDED LICENSE
Provider grants Customer an exclusive, worldwide license to access the CloudCore Enterprise Platform, including sublicensing rights to Customer's designated affiliates.

2. FEES AND PAYMENT TERMS
Monthly subscription fees are $4,200 per month payable net sixty (60) days. In the event of early termination for cause, unearned prepaid fees shall be refunded pro-rata to Customer.

3. MUTUAL CONFIDENTIALITY
Both parties mutually agree to maintain strict confidentiality of all trade secrets and user records for a period of three (3) years post-termination.

4. MUTUAL INDEMNIFICATION AND CAPPED INDEMNITY
Each party shall indemnify and defend the other against direct third-party claims arising from gross negligence or willful misconduct, subject to an aggregate monetary cap equal to twelve (12) months of paid fees.

5. BALANCED LIMITATION OF LIABILITY
Neither party's liability under this Agreement shall exceed twelve (12) times the average monthly fee paid during the contract term. Both parties remain liable for direct damages resulting from data breaches.

6. TERMINATION NOTICE
Either party may terminate this agreement with thirty (30) days prior written notice. If Provider experiences downtime exceeding 99.5%, Customer may terminate immediately with a full refund.

7. GOVERNING LAW AND ARBITRATION
This Agreement shall be governed by the laws of Texas, and all disputes shall be resolved through binding confidential arbitration under AAA rules in Austin, Texas.`;

export function DocumentUpload({ slot, label = 'Upload Legal Document', isDisabled = false }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setDocument = useDocumentStore((state) => state.setDocument);
  const setChunks = useDocumentStore((state) => state.setChunks);
  const documents = useDocumentStore((state) => state.documents);
  const disclaimerAcknowledged = useDocumentStore((state) => state.disclaimerAcknowledged);

  const processFile = async (file: File) => {
    setErrorMsg(null);

    // 1. File Count Check
    const activeDocCount = documents.filter(Boolean).length;
    if (!documents[slot]) {
      const countCheck = validateFileCount(activeDocCount, 2);
      if (!countCheck.valid) {
        setErrorMsg(countCheck.error.message);
        return;
      }
    }

    // 2. Type Check
    const typeCheck = validateFileType(file);
    if (!typeCheck.valid) {
      setErrorMsg(typeCheck.error.message);
      return;
    }

    // 3. Size Check
    const sizeCheck = validateFileSize(file, 10);
    if (!sizeCheck.valid) {
      setErrorMsg(sizeCheck.error.message);
      return;
    }

    setIsParsing(true);
    try {
      let parsed: ParsedDocument;
      const lower = file.name.toLowerCase();

      if (lower.endsWith('.pdf')) {
        parsed = await parsePdf(file);
      } else if (lower.endsWith('.docx')) {
        parsed = await parseDocx(file);
      } else {
        parsed = await parseTxt(file);
      }

      setDocument(slot, parsed);
      const chunks = chunkDocument(parsed.text);
      setChunks(slot, chunks);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to parse document. Please check the file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadSample = (sampleType: 'A' | 'B') => {
    if (isDisabled || !disclaimerAcknowledged) return;

    const isSampleA = sampleType === 'A';
    const text = isSampleA ? SAMPLE_TEXT_A : SAMPLE_TEXT_B;
    const name = isSampleA ? 'SaaS_Agreement_Sample_A.txt' : 'Enterprise_Agreement_Sample_B.txt';

    const parsed: ParsedDocument = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sample-${sampleType}-${Date.now()}`,
      name,
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      format: 'txt',
      parsedAt: Date.now(),
    };

    setDocument(slot, parsed);
    const chunks = chunkDocument(parsed.text);
    setChunks(slot, chunks);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isDisabled || !disclaimerAcknowledged || isParsing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div
        role="region"
        aria-label={label}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDisabled && disclaimerAcknowledged) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!isDisabled && disclaimerAcknowledged && !isParsing) {
            fileInputRef.current?.click();
          }
        }}
        tabIndex={isDisabled || !disclaimerAcknowledged ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-slate-400 bg-white'
        } ${isDisabled || !disclaimerAcknowledged ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          disabled={isDisabled || !disclaimerAcknowledged || isParsing}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-1">
            {isParsing ? (
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          <h4 className="text-sm font-semibold text-slate-800">
            {isParsing ? 'Extracting Plain Text...' : label}
          </h4>

          <p className="text-xs text-slate-500 max-w-xs">
            {isParsing
              ? 'Parsing pages and building search tokens client-side'
              : 'Drag & drop your PDF, DOCX, or TXT file here, or click to browse'}
          </p>

          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
            Max 10 MB • Never stored on servers
          </span>
        </div>
      </div>

      {/* Instant 1-Click Sample Contract for Fast Demo Testing */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <span className="text-[11px] text-slate-400">Need a test document?</span>
        <button
          type="button"
          disabled={isDisabled || !disclaimerAcknowledged || isParsing}
          onClick={(e) => {
            e.stopPropagation();
            handleLoadSample(slot === 0 ? 'A' : 'B');
          }}
          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors border border-indigo-200 disabled:opacity-50"
        >
          📄 Load Sample Legal Contract {slot === 0 ? 'A (SaaS Agreement)' : 'B (Enterprise Terms)'}
        </button>
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(null)} />}
    </div>
  );
}

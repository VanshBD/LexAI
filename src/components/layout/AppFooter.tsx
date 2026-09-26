'use client';

import React from 'react';

export function AppFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-8 mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <span className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center text-xs">§</span>
            <span>LexAI Legal Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Google GDG HackToSkill Competition 2026</span>
          </div>
        </div>

        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60 text-slate-300">
          <p className="font-semibold text-slate-200 mb-1">LEGAL DISCLAIMER:</p>
          <p>
            LexAI is an informational artificial intelligence platform designed to assist users in understanding complex legal documents. LexAI does NOT provide legal advice, legal opinions, or attorney representation. Use of LexAI does not create an attorney-client relationship. If you require legal assistance or are contemplating signing a binding agreement, please consult a licensed attorney.
          </p>
        </div>

        <div className="text-center text-slate-500 text-[11px] pt-2">
          © 2026 LexAI. Zero Server-Side Document Storage • Privacy-First Architecture • Google Gemini Powered
        </div>
      </div>
    </footer>
  );
}

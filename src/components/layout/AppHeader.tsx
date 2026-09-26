'use client';

import React from 'react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
            §
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              LexAI
            </h1>
            <span className="text-xs text-indigo-600 font-medium">
              GenAI Legal Intelligence Assistant
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
            Competition Edition
          </span>
        </div>
      </div>
    </header>
  );
}

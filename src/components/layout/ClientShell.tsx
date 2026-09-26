'use client';

import React from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { DisclaimerModal } from './DisclaimerModal';

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const disclaimerAcknowledged = useDocumentStore((state) => state.disclaimerAcknowledged);
  const acknowledgeDisclaimer = useDocumentStore((state) => state.acknowledgeDisclaimer);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <DisclaimerModal
        isOpen={!disclaimerAcknowledged}
        onAcknowledge={acknowledgeDisclaimer}
      />

      <AppHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <AppFooter />
    </div>
  );
}

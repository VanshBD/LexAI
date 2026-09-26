import type { Metadata } from 'next';
import './globals.css';
import ClientShell from '@/components/layout/ClientShell';

export const metadata: Metadata = {
  title: 'LexAI — GenAI Legal Intelligence Assistant',
  description:
    'Demystify complex contracts and legal documents with Google Gemini AI. Instant plain-language summaries, Legal Risk DNA visualization, interactive checklists, side-by-side comparison, and attorney prep.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <ClientShell>{children}</ClientShell>
        <div aria-live="polite" aria-atomic="false" className="sr-only" id="live-region" />
      </body>
    </html>
  );
}

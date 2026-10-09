import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SCAMCHAIN — AI-Powered Threat Investigation & Scam Campaign Correlation',
  description:
    "Don't just detect the threat. Reconstruct the attack. Defensive AI cybersecurity platform investigating suspicious websites, extracting Website DNA, and correlating multi-domain scam campaigns.",
  icons: {
    icon: '/favicon.ico',
  },
};

import { LanguageProvider } from '@/lib/i18n/LanguageContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`} suppressHydrationWarning>
      <body
        className="min-h-screen flex flex-col bg-[#080c15] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200"
        suppressHydrationWarning
      >
        <LanguageProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, Terminal, FileCode2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Platform Identity */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-slate-100 font-mono font-semibold">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span>{t.common.appName}</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              &ldquo;{t.common.tagline}&rdquo; {t.common.subTagline}
            </p>
          </div>

          {/* Investigation Capabilities */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300">
              {t.investigate.pipelineTitle}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400 font-mono">
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Multi-Signal DNA Analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Infrastructure & Host Intelligence</span>
              </li>
              <li className="flex items-center gap-2">
                <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cross-Incident Correlation Graph</span>
              </li>
              <li className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Explainable Forensic Evidence</span>
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300">
              {t.common.overview}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400 font-mono">
              <li>
                <Link href="/" className="hover:text-cyan-300 transition-colors">
                  {t.nav.overview}
                </Link>
              </li>
              <li>
                <Link href="/investigate" className="hover:text-cyan-300 transition-colors">
                  {t.nav.investigate}
                </Link>
              </li>
              <li>
                <Link href="/campaigns" className="hover:text-cyan-300 transition-colors">
                  {t.nav.campaigns}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <p>© 2026 SCAMCHAIN. All rights reserved.</p>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-500"></span>
            <span>{t.common.demoNote}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

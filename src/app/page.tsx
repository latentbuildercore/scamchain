'use client';

import React from 'react';
import { Hero } from '@/components/home/Hero';
import { ThreatGraphPreview } from '@/components/home/ThreatGraphPreview';
import Link from 'next/link';
import {
  ShieldAlert,
  Search,
  Sparkles,
  GitBranch,
  Fingerprint,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col w-full investigation-grid-bg">
      {/* Hero Section */}
      <Hero />

      {/* Stylized Threat Graph Preview Section */}
      <ThreatGraphPreview />

      {/* Core Architectural Pillars */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/30 px-3 py-1 text-xs font-mono text-blue-300 mb-3">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.home.architectureBadge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 font-mono">
            {t.home.architectureTitle}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
            {t.home.architectureSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-glass rounded-2xl p-6 sm:p-7 relative flex flex-col justify-between group">
            <div>
              <div className="h-10 w-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-105 transition-transform">
                <Fingerprint className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold font-mono text-slate-100">
                {t.home.pillar1Title}
              </h3>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                {t.home.pillar1Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/60 text-xs font-mono text-cyan-400/90 flex items-center gap-1.5">
              <span>{t.home.pillar1Footer}</span>
            </div>
          </div>

          <div className="card-glass rounded-2xl p-6 sm:p-7 relative flex flex-col justify-between group">
            <div>
              <div className="h-10 w-10 rounded-xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-105 transition-transform">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold font-mono text-slate-100">
                {t.home.pillar2Title}
              </h3>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                {t.home.pillar2Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/60 text-xs font-mono text-blue-400/90 flex items-center gap-1.5">
              <span>{t.home.pillar2Footer}</span>
            </div>
          </div>

          <div className="card-glass rounded-2xl p-6 sm:p-7 relative flex flex-col justify-between group">
            <div>
              <div className="h-10 w-10 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold font-mono text-slate-100">
                {t.home.pillar3Title}
              </h3>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                {t.home.pillar3Desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/60 text-xs font-mono text-indigo-400/90 flex items-center gap-1.5">
              <span>{t.home.pillar3Footer}</span>
            </div>
          </div>
        </div>

        {/* Investigative Intake CTA Strip */}
        <div className="mt-14 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold">
                  {t.investigate.pageBadge}
                </span>
              </div>
              <h3 className="text-lg font-mono font-bold text-slate-100">
                {t.home.readyTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {t.home.readySubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/investigate"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-xs font-mono font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-950/40"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{t.investigate.pageTitle}</span>
              </Link>
              <Link
                href="/campaigns"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800/90 border border-slate-700 px-5 py-3 text-xs font-mono font-semibold text-slate-200 hover:bg-slate-800 transition-all"
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.campaigns.directoryTitle}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import React from 'react';
import { InvestigationForm } from '@/components/investigation/InvestigationForm';
import { Terminal, Eye } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function InvestigatePageContent() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 w-full investigation-grid-bg py-8 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 text-xs font-mono text-cyan-400">
            <Eye className="w-3.5 h-3.5" />
            <span>{t.investigate.pageBadge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-slate-100">
            {t.investigate.pageTitle}
          </h1>

          <p className="text-xs sm:text-base text-slate-400 leading-relaxed font-normal">
            {t.investigate.pageSubtitle}
          </p>
        </div>

        {/* Primary Investigation Form Component */}
        <InvestigationForm />

        {/* Investigation Pipeline Specification */}
        <div className="max-w-3xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400 uppercase tracking-wider mb-4">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>{t.investigate.pipelineTitle}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <span className="text-cyan-400 font-semibold block">{t.investigate.stage1Title}</span>
              <p className="text-slate-400 leading-relaxed text-[11px] font-sans">
                {t.investigate.stage1Desc}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <span className="text-blue-400 font-semibold block">{t.investigate.stage2Title}</span>
              <p className="text-slate-400 leading-relaxed text-[11px] font-sans">
                {t.investigate.stage2Desc}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <span className="text-indigo-400 font-semibold block">{t.investigate.stage3Title}</span>
              <p className="text-slate-400 leading-relaxed text-[11px] font-sans">
                {t.investigate.stage3Desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

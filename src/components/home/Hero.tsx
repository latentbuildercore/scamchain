'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Search,
  Layers,
  Shield,
  Fingerprint,
  Cpu,
  GitBranch,
  Network,
} from 'lucide-react';
import { IntelligenceSummaryBar } from '@/components/ui/IntelligenceSummaryBar';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function Hero() {
  const { t } = useLanguage();

  const coreFlow = [
    {
      step: '01',
      title: t.hero.coreFlow.step1Title,
      desc: t.hero.coreFlow.step1Desc,
      icon: <Fingerprint className="w-4 h-4 text-cyan-400" />,
    },
    {
      step: '02',
      title: t.hero.coreFlow.step2Title,
      desc: t.hero.coreFlow.step2Desc,
      icon: <Cpu className="w-4 h-4 text-blue-400" />,
    },
    {
      step: '03',
      title: t.hero.coreFlow.step3Title,
      desc: t.hero.coreFlow.step3Desc,
      icon: <GitBranch className="w-4 h-4 text-indigo-400" />,
    },
    {
      step: '04',
      title: t.hero.coreFlow.step4Title,
      desc: t.hero.coreFlow.step4Desc,
      icon: <Network className="w-4 h-4 text-rose-400" />,
    },
  ];

  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none radar-glow opacity-80" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Hero Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono font-medium text-cyan-300 mb-8 backdrop-blur-md">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.hero.badge}</span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-100 font-mono">
            SCAMCHAIN
          </h1>

          {/* Subheading / Tagline */}
          <div className="mt-5 space-y-1">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-200 to-blue-400">
              {t.common.tagline.split('.')[0] || t.common.tagline}.
            </h2>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-cyan-400 font-mono">
              {t.hero.highlight}
            </h2>
          </div>

          {/* Supporting Text */}
          <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl leading-relaxed font-normal">
            {t.hero.description}
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href="/investigate"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-mono font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 shadow-lg shadow-cyan-950/60 transition-all group"
            >
              <Search className="w-4 h-4 text-slate-950" />
              <span>{t.investigate.pageTitle}</span>
              <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/campaigns"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-mono font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all shadow-md"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>{t.campaigns.directoryTitle}</span>
            </Link>
          </div>

          {/* Visual Product Flow: Evidence → Investigation → Correlation → Campaign */}
          <div className="mt-14 w-full max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
              {coreFlow.map((item, idx) => (
                <div
                  key={item.title}
                  className="card-glass rounded-xl p-4 relative group hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.step}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-slate-200">
                    <span>{item.title}</span>
                    {idx < coreFlow.length - 1 && (
                      <span className="hidden lg:inline text-slate-400 ml-auto text-xs">→</span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Threat Intelligence Overview Strip */}
        <div className="mt-16">
          <IntelligenceSummaryBar />
        </div>
      </div>
    </section>
  );
}

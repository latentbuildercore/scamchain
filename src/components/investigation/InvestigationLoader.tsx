'use client';

import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, AlertTriangle, RotateCcw } from 'lucide-react';

interface StageDefinition {
  step: number;
  title: string;
  desc: string;
}

interface InvestigationLoaderProps {
  url: string;
  activeStage: number;
  failedStage?: number | null;
  stageWarning?: string | null;
  errorMessage?: string | null;
  onReset: () => void;
  /** Override the default URL-pipeline stages with custom stages (e.g. screenshot pipeline). */
  stages?: StageDefinition[];
}


export const STAGES = [
  {
    step: 1,
    title: '1. Parsing URL',
    desc: 'Validating URL structure, protocols, and security boundaries.',
  },
  {
    step: 2,
    title: '2. Gathering website metadata',
    desc: 'Establishing safe read-only connection and analyzing HTTP response.',
  },
  {
    step: 3,
    title: '3. Extracting evidence',
    desc: 'Extracting DOM structure, page text, headers, and external domain references.',
  },
  {
    step: 4,
    title: '4. Running AI analysis',
    desc: 'Evaluating observable technical evidence with Gemini threat reasoning.',
  },
  {
    step: 5,
    title: '5. Checking threat intelligence',
    desc: 'Querying Google Safe Browsing and security intelligence databases.',
  },
  {
    step: 6,
    title: '6. Building Website DNA',
    desc: 'Constructing normalized, deterministic technical fingerprint.',
  },
  {
    step: 7,
    title: '7. Searching previous incidents',
    desc: 'Correlating observable indicators against known threat campaign clusters.',
  },
  {
    step: 8,
    title: '8. Preparing assessment',
    desc: 'Synthesizing evidence-based findings, confidence, and defensive actions.',
  },
];

export function InvestigationLoader({
  url,
  activeStage,
  failedStage,
  stageWarning,
  errorMessage,
  onReset,
  stages: customStages,
}: InvestigationLoaderProps) {
  const stageList = customStages || STAGES;
  const totalStages = stageList.length;
  const progressPercent = Math.min(100, Math.round((activeStage / totalStages) * 100));


  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="card-glass rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        {/* Subtle top indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              errorMessage
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                LIVE INVESTIGATION PIPELINE
              </span>
              <h3 className="text-lg font-mono font-bold text-slate-100 mt-1">
                {errorMessage ? 'Investigation Interrupted' : 'Processing Observable Evidence'}
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              {errorMessage ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              )}
              <span>{progressPercent}% complete</span>
            </div>
          </div>

          {/* Target URL banner */}
          <div className="mb-6 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 font-mono text-xs text-slate-300 break-all flex items-center justify-between gap-2">
            <span className="text-slate-400">TARGET:</span>
            <span className="text-cyan-300 font-semibold">{url}</span>
          </div>

          {/* Error Message if Fatal */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs font-mono text-rose-300 space-y-3">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <span>INVESTIGATION FAILED</span>
              </div>
              <p className="text-slate-200 font-sans">{errorMessage}</p>
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Another URL</span>
              </button>
            </div>
          )}

          {/* Stage Warning if Soft Failure (Engine continued) */}
          {stageWarning && (
            <div className="mb-4 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs font-mono text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{stageWarning}</span>
            </div>
          )}

          {/* Stages Stack */}
          <div className="space-y-3">
            {stageList.map((stage) => {
              const isDone = activeStage > stage.step;
              const isCurrent = activeStage === stage.step && !errorMessage;
              const isFailed = failedStage === stage.step;

              return (
                <div
                  key={stage.step}
                  className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all ${
                    isFailed
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                      : isDone
                      ? 'bg-slate-900/40 border-slate-800/80 text-slate-300'
                      : isCurrent
                      ? 'bg-cyan-950/40 border-cyan-700/60 text-slate-100 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/20 border-slate-900/40 text-slate-500'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isFailed ? (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    ) : isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-800 flex items-center justify-center text-[9px] font-mono text-slate-500">
                        {stage.step}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4
                      className={`text-xs font-mono font-semibold ${
                        isCurrent
                          ? 'text-cyan-300'
                          : isDone
                          ? 'text-slate-200'
                          : isFailed
                          ? 'text-rose-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {stage.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

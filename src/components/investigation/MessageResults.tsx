'use client';

import React, { useState } from 'react';
import { MessageInvestigationRecord, MessageThreatClassification } from '@/types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  MessageSquare,
  Sparkles,
  Link as LinkIcon,
  Smile,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  Download,
  Info,
  Languages,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { InvestigationResults } from './InvestigationResults';
import { InvestigationReportModal } from './InvestigationReportModal';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface MessageResultsProps {
  record: MessageInvestigationRecord;
  screenshotPreviewUrl?: string | null;
  onReset: () => void;
}

export function MessageResults({ record, screenshotPreviewUrl, onReset }: MessageResultsProps) {
  const [copied, setCopied] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { t } = useLanguage();

  const { classification, confidence, messageAnalysis, extractedUrls, urlInvestigation } = record;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getClassificationMeta = (cls: MessageThreatClassification) => {
    switch (cls) {
      case 'SCAM':
        return {
          label: t.investigate.classifications.scam,
          color: 'text-rose-400',
          bg: 'bg-rose-950/60',
          border: 'border-rose-500/60',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <ShieldAlert className="w-6 h-6 text-rose-400" />,
        };
      case 'SUSPICIOUS':
        return {
          label: messageAnalysis.possibleHumorOrJoke
            ? t.investigate.classifications.humorousSuspicious
            : t.investigate.classifications.suspicious,
          color: 'text-amber-400',
          bg: 'bg-amber-950/60',
          border: 'border-amber-500/60',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
        };
      case 'LEGITIMATE':
        return {
          label: t.investigate.classifications.legitimate,
          color: 'text-emerald-400',
          bg: 'bg-emerald-950/60',
          border: 'border-emerald-500/60',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
        };
      default:
        return {
          label: t.investigate.classifications.unknown,
          color: 'text-slate-300',
          bg: 'bg-slate-900/60',
          border: 'border-slate-700/60',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <HelpCircle className="w-6 h-6 text-slate-400" />,
        };
    }
  };

  const meta = getClassificationMeta(classification);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* 1. THREAT ASSESSMENT HEADER CARD */}
      <div className={`card-glass rounded-2xl p-6 sm:p-8 border ${meta.border} relative overflow-hidden shadow-2xl`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${meta.bg} border ${meta.border} shrink-0`}>
              {meta.icon}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  {t.investigate.results.threatAssessment}
                </span>
                {messageAnalysis.possibleHumorOrJoke && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                    <Smile className="w-3 h-3" />
                    <span>{t.investigate.results.humorNote}</span>
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${meta.color}`}>
                  {meta.label}
                </h2>
                <div className="flex items-center gap-1.5 font-mono text-sm text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="text-slate-400">{t.investigate.results.confidenceLabel}:</span>
                  <span className="font-bold text-cyan-300">{confidence}%</span>
                </div>
                {messageAnalysis.detectedLanguage && (
                  <div className="flex items-center gap-1.5 font-mono text-sm text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                    <Languages className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-400">{t.investigate.results.detectedLanguage}:</span>
                    <span className="font-bold text-cyan-300">{messageAnalysis.detectedLanguage}</span>
                  </div>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400 pt-1">
                Investigation Mode:{' '}
                <span className="text-cyan-300 font-semibold">
                  {record.investigationType === 'message'
                    ? t.investigate.form.textHeader
                    : t.investigate.form.screenshotHeader}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            <button
              type="button"
              aria-label="Download investigation report as PDF or HTML"
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/70 text-xs font-mono font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.investigate.results.downloadReport}</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.investigate.results.newAnalysis}</span>
            </button>
            <button
              type="button"
              onClick={copyJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copy JSON Analysis Report"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.common.copied : t.investigate.results.exportJson}</span>
            </button>
          </div>
        </div>

        {/* Primary Explanation */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2">
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            {messageAnalysis.explanation}
          </p>
          {messageAnalysis.explanationInDetectedLanguage && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-sans text-cyan-300">
              <span className="font-mono text-[10px] text-slate-400 uppercase font-semibold block">
                Explanation in {messageAnalysis.detectedLanguage}:
              </span>
              <p className="mt-0.5">{messageAnalysis.explanationInDetectedLanguage}</p>
            </div>
          )}
          {messageAnalysis.fallbackUsed && (
            <p className="mt-2 text-[11px] font-mono text-slate-400">
              *Evaluated via defensive heuristic fallback engine.
            </p>
          )}
        </div>
      </div>

      {/* 2. WHY WE FLAGGED IT */}
      <div className="card-glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            {t.investigate.results.whyWeFlaggedIt}
          </h3>
        </div>

        {messageAnalysis.findings && messageAnalysis.findings.length > 0 ? (
          <ul className="space-y-2.5">
            {messageAnalysis.findings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                <span className="leading-relaxed font-sans">{finding}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">No explicit threat findings identified.</p>
        )}

        {messageAnalysis.riskFactors && messageAnalysis.riskFactors.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-mono text-slate-400">Observed Risk Factors:</span>
            {messageAnalysis.riskFactors.map((rf, idx) => (
              <span
                key={idx}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300"
              >
                {rf}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. IDENTITY RISK */}
      {(messageAnalysis.impersonationDetected ||
        messageAnalysis.identityTheftRisk !== 'LOW' ||
        (messageAnalysis.sensitiveInformationRequested && messageAnalysis.sensitiveInformationRequested.length > 0) ||
        (messageAnalysis.identityRiskFindings && messageAnalysis.identityRiskFindings.length > 0)) && (
        <div className="card-glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              {t.investigate.results.identityRisk}
            </h3>
            {messageAnalysis.identityTheftRisk && (
              <span
                className={`ml-auto text-[11px] font-mono px-2 py-0.5 rounded border ${
                  messageAnalysis.identityTheftRisk === 'HIGH'
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                    : messageAnalysis.identityTheftRisk === 'MEDIUM'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                    : messageAnalysis.identityTheftRisk === 'LOW'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Identity Theft Risk: {messageAnalysis.identityTheftRisk}
              </span>
            )}
          </div>

          {messageAnalysis.impersonationDetected && (
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
              <span className="text-amber-400 font-bold shrink-0">⚠</span>
              <span>{t.investigate.results.impersonationWarning}</span>
            </div>
          )}

          {messageAnalysis.identityRiskFindings && messageAnalysis.identityRiskFindings.length > 0 && (
            <ul className="space-y-2">
              {messageAnalysis.identityRiskFindings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                  <span className="text-rose-400 font-bold shrink-0 mt-0.5">!</span>
                  <span className="leading-relaxed font-sans">{finding}</span>
                </li>
              ))}
            </ul>
          )}

          {messageAnalysis.sensitiveInformationRequested && messageAnalysis.sensitiveInformationRequested.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-mono text-slate-400">{t.investigate.results.sensitiveDataWarning}</span>
              {messageAnalysis.sensitiveInformationRequested.map((item, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. MESSAGE CONTENT & EXTRACTED TEXT */}
      <div className="card-glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              {t.investigate.results.originalMessage}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Multimodal OCR Transcription
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {screenshotPreviewUrl && (
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-900 flex items-center justify-center overflow-hidden max-h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotPreviewUrl}
                alt="Analyzed screenshot preview"
                className="max-h-44 max-w-full rounded object-contain"
              />
            </div>
          )}

          <div
            className={`p-4 rounded-xl bg-slate-950/80 border border-slate-900 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed select-all overflow-y-auto max-h-48 ${
              screenshotPreviewUrl ? 'md:col-span-2' : 'col-span-3'
            }`}
          >
            {messageAnalysis.extractedText || 'No visible text could be transcribed from the image.'}
          </div>
        </div>

        {/* Links Found */}
        {extractedUrls && extractedUrls.length > 0 && (
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 font-semibold">
              <LinkIcon className="w-4 h-4" />
              <span>
                {t.investigate.results.detectedLinks} ({extractedUrls.length})
              </span>
            </div>
            <div className="space-y-2">
              {extractedUrls.map((link, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80"
                >
                  <span className="text-xs font-mono text-cyan-200 break-all select-all">
                    {link}
                  </span>
                  <Link
                    href={`/investigate?url=${encodeURIComponent(link)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono font-medium transition-colors shrink-0 self-start sm:self-auto"
                  >
                    <span>{t.investigate.results.investigateLink || 'Investigate in Scanner'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. WHAT THIS COULD MEAN */}
      <div className="card-glass rounded-2xl p-6 space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
          {t.investigate.results.whatThisCouldMean}
        </h3>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          {messageAnalysis.possibleHumorOrJoke
            ? 'This message shows satirical or playful patterns, but requests money or sensitive information. Do not transfer funds or credentials based on playful communications.'
            : classification === 'SCAM' || classification === 'SUSPICIOUS'
            ? 'The message exhibits common social-engineering and deception patterns. Attackers often deploy urgent appeals, fake authority claims, or impersonation to induce hasty compliance.'
            : 'The message appears consistent with routine communication without observable fraudulent solicitation.'}
        </p>
      </div>

      {/* 5. WHAT WE COULD NOT VERIFY */}
      <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-900 space-y-1.5 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase tracking-wider font-semibold text-[11px]">
            {t.investigate.results.whatWeCouldNotVerify}
          </span>
        </div>
        <p className="text-slate-400 font-sans leading-relaxed text-xs">
          We cannot verify the real-world identity of the sender or their actual relationship to you from this message alone. Treat any unverified request for OTPs, account access, or financial transfer with extreme caution.
        </p>
      </div>

      {/* 6. RECOMMENDED NEXT STEPS */}
      <div className="card-glass rounded-2xl p-6 space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <span>{t.investigate.results.recommendedNextSteps}</span>
        </h3>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900 text-xs text-slate-300 font-sans leading-relaxed">
          {messageAnalysis.recommendedAction}
        </div>
      </div>

      {/* 6. CORRELATED URL INVESTIGATION (If a link was found and investigated) */}
      {urlInvestigation && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 px-1">
            <LinkIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold tracking-wider text-cyan-300 uppercase">
              {t.investigate.results.linkInvestigationHeading}
            </h3>
          </div>
          <p className="text-xs text-slate-400 px-1 font-sans">
            {t.investigate.results.linkInvestigationDesc}
          </p>

          <InvestigationResults record={urlInvestigation} onReset={onReset} />
        </div>
      )}

      {/* 7. ADVANCED TECHNICAL DETAILS */}
      <div className="card-glass rounded-2xl border border-slate-800/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen((prev) => !prev)}
          className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors"
          aria-expanded={isAdvancedOpen}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-mono font-bold tracking-wider text-slate-200">
                {t.investigate.results.advancedTechnicalDetails}
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              For security researchers and forensic analysts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-cyan-400 hidden sm:inline">
              {isAdvancedOpen ? t.common.hideDetails : t.common.showDetails}
            </span>
            <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        {isAdvancedOpen && (
          <div className="p-6 pt-2 border-t border-slate-800/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-900 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Analysis ID:</span>
                <span className="text-cyan-300 font-bold select-all">{record.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Vision Model:</span>
                <span className="text-slate-300">{messageAnalysis.modelUsed}</span>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-xs font-mono text-slate-300 overflow-x-auto select-all max-h-[300px]">
              {JSON.stringify(record, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Investigation Report Download Modal */}
      <InvestigationReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        investigationType={record.investigationType || 'message'}
        messageRecord={record}
      />
    </div>
  );
}

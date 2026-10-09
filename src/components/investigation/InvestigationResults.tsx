'use client';

import React, { useState } from 'react';
import { InvestigationRecord, ThreatClassification } from '@/types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Globe,
  Terminal,
  Fingerprint,
  Layers,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  Lock,
  Unlock,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { InvestigationReportModal } from './InvestigationReportModal';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface InvestigationResultsProps {
  record: InvestigationRecord;
  onReset: () => void;
}

export function InvestigationResults({ record, onReset }: InvestigationResultsProps) {
  const [copied, setCopied] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { t } = useLanguage();

  const {
    normalizedUrl,
    classification,
    confidence,
    observedSignals,
    threatIntelligence,
    geminiAnalysis,
    websiteDNA,
    campaignIds,
    campaignRelationship,
    recommendations,
  } = record;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getClassificationMeta = (cls: ThreatClassification) => {
    switch (cls) {
      case 'HIGH_RISK':
        return {
          label: t.investigate.classifications.highRisk,
          color: 'text-rose-400',
          bg: 'bg-rose-950/60',
          border: 'border-rose-500/60',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <ShieldAlert className="w-6 h-6 text-rose-400" />,
        };
      case 'SUSPICIOUS':
        return {
          label: t.investigate.classifications.suspicious,
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

  const formatCampaignCode = (id: string) => {
    // Convert 'camp-c17' to 'C-17', or keep uppercase representation
    if (id.toLowerCase().startsWith('camp-')) {
      return id.slice(5).toUpperCase();
    }
    return id.toUpperCase();
  };

  const getStrengthLabel = (score: number) => {
    if (score >= 80) return { label: 'Strong connection', color: 'text-rose-400', badge: 'bg-rose-950/50 text-rose-300 border-rose-800/50' };
    if (score >= 60) return { label: 'Moderate connection', color: 'text-amber-400', badge: 'bg-amber-950/50 text-amber-300 border-amber-800/50' };
    return { label: 'Weak connection', color: 'text-slate-300', badge: 'bg-slate-900 text-slate-300 border-slate-800' };
  };

  const translateEvidenceItem = (item: string): string => {
    const lower = item.toLowerCase();

    // Targeted brand / Impersonation
    if (
      lower.includes('targeted-brand relationship') ||
      lower.includes('targets uniswap') ||
      lower.includes('explicitly targets') ||
      lower.includes('impersonation brand')
    ) {
      if (lower.includes('uniswap')) {
        return 'Same brand being impersonated — Uniswap';
      }
      const parts = item.split(':');
      if (parts.length > 1 && parts[1].trim()) {
        return `Same brand being impersonated — ${parts[1].trim()}`;
      }
      return 'Same brand being impersonated';
    }

    // Matching structural fingerprint
    if (lower.includes('structural fingerprint')) {
      return 'Similar website design and layout';
    }

    // Matching kit fingerprint
    if (lower.includes('kit fingerprint') || lower.includes('matching kit')) {
      return 'Similar scam-related technology';
    }

    // Matching delivery vector
    if (lower.includes('delivery vector') || lower.includes('test vector')) {
      return 'Similar way the website was promoted or shared';
    }

    // Shared infrastructure indicators
    if (lower.includes('shared infrastructure') || lower.includes('infrastructure overlaps')) {
      return 'Similar connections to other websites involved in the campaign';
    }

    // Exact domain match
    if (lower.includes('exact domain match')) {
      return 'Identical domain previously reported in this campaign';
    }

    // Visual theme match
    if (lower.includes('visual') || lower.includes('page theme')) {
      return 'Similar website design and layout';
    }

    // Redirect infrastructure
    if (lower.includes('redirect')) {
      return 'Similar website forwarding and redirection paths';
    }

    // Synthetic test fixture fallback
    if (lower.includes('synthetic fixture') || lower.includes('synthetic')) {
      return 'Simulated campaign test indicators (Demo)';
    }

    return item;
  };

  const [expandedTechnicalMatches, setExpandedTechnicalMatches] = useState<Record<string, boolean>>({});

  const toggleTechnicalMatch = (campaignId: string) => {
    setExpandedTechnicalMatches((prev) => ({
      ...prev,
      [campaignId]: !prev[campaignId],
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* 1. THREAT ASSESSMENT HEADER CARD (Verdict & Confidence) */}
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
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${meta.color}`}>
                  {meta.label}
                </h2>
                <div className="flex items-center gap-1.5 font-mono text-sm text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="text-slate-400">{t.investigate.results.confidenceLabel}:</span>
                  <span className="font-bold text-cyan-300">{confidence}%</span>
                </div>
              </div>
              <p className="text-xs font-mono text-slate-400 break-all pt-1">
                {t.investigate.results.targetLabel}: <span className="text-slate-200">{normalizedUrl}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            <button
              type="button"
              aria-label="Download full forensic report as PDF or HTML"
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/70 text-xs font-mono font-semibold transition-colors shadow-sm cursor-pointer"
              title="Download full forensic report as PDF or HTML"
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
              <span>{t.investigate.results.newInvestigation}</span>
            </button>
            <button
              type="button"
              onClick={copyJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copy JSON Investigation Report"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.common.copied : t.investigate.results.exportJson}</span>
            </button>
          </div>
        </div>

        {/* Primary Explanation */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            {geminiAnalysis.explanation}
          </p>
          {geminiAnalysis.fallbackUsed && (
            <p className="mt-2 text-[11px] font-mono text-slate-400">
              *Analysis computed via deterministic heuristic evaluation.
            </p>
          )}
        </div>
      </div>

      {/* 2. WHY WE FLAGGED IT */}
      <div className="card-glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            WHY WE FLAGGED IT
          </h3>
        </div>

        <p className="text-xs text-slate-400 font-sans">
          Observational evidence collected directly from the website&apos;s DNS, response headers, TLS, and content.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Suspicious Signals */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 space-y-2">
            <span className="text-xs font-mono text-rose-400 font-semibold block">
              Observed Suspicious Signals ({geminiAnalysis.suspiciousSignals.length})
            </span>
            {geminiAnalysis.suspiciousSignals.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-300">
                {geminiAnalysis.suspiciousSignals.map((sig, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 shrink-0 mt-0.5">•</span>
                    <span>{sig}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No explicit hostile signals detected.</p>
            )}
          </div>

          {/* Benign Signals */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 space-y-2">
            <span className="text-xs font-mono text-emerald-400 font-semibold block">
              Observed Benign Signals ({geminiAnalysis.benignSignals.length})
            </span>
            {geminiAnalysis.benignSignals.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-300">
                {geminiAnalysis.benignSignals.map((sig, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                    <span>{sig}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No verifiable benign signals documented.</p>
            )}
          </div>
        </div>

        {/* Identity & Purpose context */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-1">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 space-y-1">
            <span className="text-slate-400 uppercase block text-[10px]">
              Does this website match who it claims to be?
            </span>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-slate-200 font-semibold text-xs truncate">
                {geminiAnalysis.claimedOrganization}
              </span>
              <span
                className={`font-bold text-xs shrink-0 ${
                  geminiAnalysis.identityConsistency === 'Consistent'
                    ? 'text-emerald-400'
                    : geminiAnalysis.identityConsistency === 'Suspicious' || geminiAnalysis.identityConsistency === 'Inconsistent'
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {geminiAnalysis.identityConsistency}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 space-y-1">
            <span className="text-slate-400 uppercase block text-[10px]">
              What this website appears to do
            </span>
            <span className="text-slate-300 text-xs block leading-snug pt-0.5">
              {geminiAnalysis.sitePurpose}
            </span>
          </div>
        </div>

        {/* Potential Phishing Indicators */}
        {geminiAnalysis.potentialPhishingIndicators.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs font-mono text-amber-300 space-y-1">
            <span className="font-semibold block uppercase">Potential Phishing Indicators:</span>
            <p className="text-slate-300 font-sans text-xs">
              {geminiAnalysis.potentialPhishingIndicators.join(' • ')}
            </p>
          </div>
        )}
      </div>

      {/* 3. WHAT THIS COULD MEAN */}
      <div className="card-glass rounded-2xl p-6 space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
          WHAT THIS COULD MEAN
        </h3>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          {classification === 'HIGH_RISK'
            ? 'This website exhibits structural and content characteristics commonly used to mimic legitimate services and harvest credentials or funds. Entering passwords or connecting digital wallets carries high risk.'
            : classification === 'SUSPICIOUS'
            ? 'This website shows anomalies in identity, certificate, or layout that deviate from verified services. We recommend verifying its legitimacy through an official channel before interacting.'
            : classification === 'LEGITIMATE'
            ? 'This website belongs to established organizational infrastructure and follows proper security practices. No malicious indicators were observed.'
            : 'There is insufficient observable signal to definitively verify this website. Proceed with standard caution.'}
        </p>
      </div>

      {/* 4. WHAT WE COULD NOT VERIFY */}
      <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-900 space-y-1.5 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase tracking-wider font-semibold text-[11px]">
            WHAT WE COULD NOT VERIFY
          </span>
        </div>
        <p className="text-slate-400 font-sans leading-relaxed text-xs">
          We could not independently verify off-line business identity or backend server operators beyond public DNS, TLS, and observable page responses. This assessment represents an automated risk evaluation, not a legal attribution.
        </p>
      </div>

      {/* 5. RECOMMENDED NEXT STEPS */}
      <div className="card-glass rounded-2xl p-6 space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <span>RECOMMENDED NEXT STEPS</span>
        </h3>

        <ul className="space-y-2 text-xs text-slate-300 font-sans">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/40 border border-slate-900">
              <span className="text-cyan-400 font-mono font-bold">{idx + 1}.</span>
              <span className="leading-relaxed">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. CAMPAIGN CONNECTION */}
      {campaignIds.length > 0 && (
        <div className="card-glass rounded-2xl p-6 sm:p-7 space-y-6 border border-cyan-500/30">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold">
                CAMPAIGN CONNECTION
              </h3>
            </div>

            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Demo environment — simulated campaign data
            </span>
          </div>

          {record.campaignMatches && record.campaignMatches.length > 0 ? (
            <div className="space-y-5">
              {record.campaignMatches.map((match) => {
                const strength = getStrengthLabel(match.score);
                const campaignCode = formatCampaignCode(match.campaignId);
                const isExpanded = !!expandedTechnicalMatches[match.campaignId];

                return (
                  <div
                    key={match.campaignId}
                    className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-5 sm:p-6 space-y-5"
                  >
                    {/* Header: Strength & Campaign Code */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`text-base font-bold font-mono tracking-tight ${strength.color}`}>
                            {strength.label} — {campaignCode}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${strength.badge}`}>
                            Correlation score: {match.score}/100
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">
                          This website shares several characteristics with websites previously linked to the same scam campaign.
                        </p>
                      </div>

                      <Link
                        href={`/campaigns/${match.campaignId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 px-3 py-1.5 rounded-lg transition-colors shrink-0 self-start sm:self-auto"
                      >
                        <span>Explore related activity</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* WHY WE FOUND A CONNECTION */}
                    {(() => {
                      // Translate and deduplicate items, while filtering out raw internal fixture strings from user list
                      const uniqueItems = Array.from(
                        new Set(
                          (match.evidence || [])
                            .map((rawEv) => translateEvidenceItem(rawEv))
                            .filter(
                              (translated) =>
                                translated &&
                                translated !== 'Simulated campaign test indicators (Demo)'
                            )
                        )
                      );

                      if (uniqueItems.length === 0) return null;

                      return (
                        <div className="space-y-2.5">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                            WHY WE FOUND A CONNECTION
                          </span>

                          <ul className="space-y-2">
                            {uniqueItems.map((translated, idx) => (
                              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                                <span className="leading-relaxed font-sans">{translated}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}

                    {/* WHAT THIS MEANS */}
                    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                        WHAT THIS MEANS
                      </span>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        This may be part of a larger scam campaign rather than an isolated website.
                      </p>
                    </div>

                    {/* COLLAPSIBLE TECHNICAL DETAILS */}
                    <div className="pt-2 border-t border-slate-900">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleTechnicalMatch(match.campaignId)}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded p-1 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{isExpanded ? 'Hide technical details' : 'View technical details'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3 animate-fade-in">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400 uppercase tracking-wider text-[10px]">
                              TECHNICAL CORRELATION
                            </span>
                            <span className="text-cyan-400">
                              Correlation score: {match.score}/100
                            </span>
                          </div>

                          <ul className="space-y-1.5 font-mono text-xs text-slate-300">
                            {match.evidence.map((evidence, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-cyan-400 shrink-0">•</span>
                                <span className="break-all">{evidence}</span>
                              </li>
                            ))}
                          </ul>

                          <p className="text-[11px] font-mono text-slate-500 pt-1">
                            This section is for advanced users and cybersecurity analysts. Correlation is based on observed indicators and does not imply absolute certainty.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {campaignRelationship}
            </p>
          )}

          <div className="pt-1 text-[11px] font-mono text-slate-500">
            Correlation is based on observed indicators from simulated research datasets.
          </div>
        </div>
      )}

      {/* 5. COLLAPSIBLE ADVANCED TECHNICAL EVIDENCE SECTION */}
      <div className="card-glass rounded-2xl border border-slate-800/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen((prev) => !prev)}
          className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-mono font-bold tracking-wider text-slate-200">
                ADVANCED TECHNICAL EVIDENCE
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              For security researchers and analysts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-cyan-400 hidden sm:inline">
              {isAdvancedOpen ? 'Hide Details' : 'Show Details'}
            </span>
            <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        {isAdvancedOpen && (
          <div className="p-6 pt-2 border-t border-slate-800/80 space-y-6">
            {/* Investigation Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-900 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Investigation ID:</span>
                <span className="text-cyan-300 font-bold select-all">{record.id}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Storage Source:</span>
                <span className="text-slate-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {record.storageSource === 'firestore' ? 'Cloud Firestore (Durable)' : 'Ephemeral Session Cache (Non-durable)'}
                </span>
              </div>
            </div>

            {/* Infrastructure & Network Signals */}
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block">
                Infrastructure & Network Signals
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900">
                  <span className="text-slate-400 uppercase block text-[10px]">HTTP Status</span>
                  <span className="text-slate-200 font-bold mt-1 block">
                    {observedSignals.httpStatus} ({observedSignals.statusText})
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900">
                  <span className="text-slate-400 uppercase block text-[10px]">TLS / HTTPS</span>
                  <div className="flex items-center gap-1.5 mt-1 font-bold">
                    {observedSignals.tlsMetadata.isSecure ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Secure (HTTPS)</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-rose-400">Plain (Insecure HTTP)</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900">
                  <span className="text-slate-400 uppercase block text-[10px]">HSTS</span>
                  <span
                    className={`font-bold mt-1 block ${
                      observedSignals.tlsMetadata.hstsEnforced ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {observedSignals.tlsMetadata.hstsEnforced ? 'Enforced' : 'Not Configured'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900">
                  <span className="text-slate-400 uppercase block text-[10px]">Infrastructure (Server)</span>
                  <span className="text-slate-300 mt-1 block truncate">
                    {observedSignals.securityHeaders.server}
                  </span>
                </div>
              </div>

              {/* Redirects & Page Title */}
              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-900 flex justify-between gap-2">
                  <span className="text-slate-400">Page Title:</span>
                  <span className="text-slate-200 truncate max-w-md">{observedSignals.pageTitle}</span>
                </div>
                {observedSignals.redirectCount > 0 && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-900 flex justify-between gap-2">
                    <span className="text-slate-400">Redirects ({observedSignals.redirectCount}):</span>
                    <span className="text-cyan-400 truncate max-w-md">{observedSignals.finalUrl}</span>
                  </div>
                )}
              </div>

              {/* External Domains */}
              {observedSignals.externalDomains.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">
                    External Domains Referenced ({observedSignals.externalDomains.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {observedSignals.externalDomains.map((domain) => (
                      <span
                        key={domain}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* KNOWN THREAT CHECKS */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                    KNOWN THREAT CHECKS
                  </span>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded ${
                    threatIntelligence.listed
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : threatIntelligence.status === 'Clean (Not Listed)'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {threatIntelligence.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {threatIntelligence.details}
              </p>
            </div>

            {/* TECHNICAL FINGERPRINT */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                    TECHNICAL FINGERPRINT
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(websiteDNA, null, 2));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Fingerprint</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-xs font-mono text-cyan-300 overflow-x-auto select-all leading-relaxed max-h-[300px]">
                {JSON.stringify(websiteDNA, null, 2)}
              </pre>
            </div>

            {/* TECHNICAL REPORT (Raw JSON) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                    TECHNICAL REPORT
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyJson}
                  className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Report</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-xs font-mono text-slate-300 overflow-x-auto select-all max-h-[350px]">
                {JSON.stringify(record, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Investigation Report Download Modal */}
      <InvestigationReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        investigationType="url"
        urlRecord={record}
      />
    </div>
  );
}


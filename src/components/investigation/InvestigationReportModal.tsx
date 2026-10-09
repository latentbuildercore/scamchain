'use client';

import React, { useRef } from 'react';
import {
  Shield,
  Printer,
  Download,
  X,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  Layers,
  FileText,
  Clock,
  Hash,
  Globe,
  Info,
} from 'lucide-react';
import { InvestigationRecord, MessageInvestigationRecord } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface InvestigationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigationType: 'url' | 'message' | 'screenshot';
  urlRecord?: InvestigationRecord;
  messageRecord?: MessageInvestigationRecord;
}

export function InvestigationReportModal({
  isOpen,
  onClose,
  investigationType,
  urlRecord,
  messageRecord,
}: InvestigationReportModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useLanguage();

  // Close modal on Escape key press
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const isUrl = investigationType === 'url' && !!urlRecord;
  const isMessage = (investigationType === 'message' || investigationType === 'screenshot') && !!messageRecord;

  const referenceId = isUrl ? urlRecord?.id : messageRecord?.id;
  const timestamp = isUrl ? urlRecord?.createdAt : messageRecord?.createdAt;
  const formattedDate = timestamp ? new Date(timestamp).toUTCString() : new Date().toUTCString();

  const classification = isUrl
    ? urlRecord?.classification
    : messageRecord?.classification;
  const confidence = isUrl ? urlRecord?.confidence : messageRecord?.confidence;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <title>${t.report.title} - ${referenceId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #0f172a; margin: 0; padding: 24px; line-height: 1.5; }
    h1, h2, h3, h4 { color: #0f172a; margin-top: 0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; font-family: monospace; }
    .badge-high { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
    .badge-suspicious { background: #fef3c7; color: #92400e; border: 1px solid #fbbf24; }
    .badge-legit { background: #dcfce7; color: #166534; border: 1px solid #4ade80; }
    .badge-neutral { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px; page-break-inside: avoid; background: #f8fafc; }
    .field-label { font-size: 11px; text-transform: uppercase; font-family: monospace; color: #64748b; font-weight: bold; margin-bottom: 4px; }
    .break-url { word-break: break-all; overflow-wrap: anywhere; font-family: monospace; font-size: 12px; }
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin-bottom: 6px; }
    .footer-note { font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scamchain-investigation-${referenceId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl print:border-none print:shadow-none print:max-h-none print:bg-white print:text-slate-950"
      >
        {/* Actions Bar (hidden when printing) */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h2 id="report-modal-title" className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              {t.report.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.report.printPdf}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.report.downloadHtml}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={t.report.closeDialog}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div
          ref={printRef}
          className="p-6 sm:p-10 space-y-6 text-slate-200 print:text-slate-900 print:p-8"
        >
          {/* Header & Branding */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 print:border-slate-300">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 print:bg-slate-100 print:border-slate-300 print:text-slate-900">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black font-mono tracking-wider text-slate-100 print:text-slate-950">
                    SCAMCHAIN
                  </h1>
                  <p className="text-[10px] font-mono tracking-tight text-slate-400 print:text-slate-600">
                    DEFENSIVE THREAT INVESTIGATION PLATFORM
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1 sm:text-right font-mono text-xs text-slate-400 print:text-slate-600">
              <div className="flex items-center sm:justify-end gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-400 print:text-slate-700" />
                <span>{t.report.referenceId}:</span>
                <span className="font-bold text-slate-200 select-all print:text-slate-900">
                  {referenceId}
                </span>
              </div>
              <div className="flex items-center sm:justify-end gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400 print:text-slate-700" />
                <span>{t.report.investigationDate}:</span>
                <span className="text-slate-300 print:text-slate-900">{formattedDate}</span>
              </div>
              <div>
                <span>{t.report.investigationType}: </span>
                <span className="font-bold text-cyan-300 uppercase print:text-slate-900">
                  {investigationType === 'url'
                    ? t.investigate.modes.url
                    : investigationType === 'screenshot'
                    ? t.investigate.modes.screenshot
                    : t.investigate.modes.text}
                </span>
              </div>
            </div>
          </div>

          {/* Target Summary */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 print:bg-slate-50 print:border-slate-300 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold print:text-slate-600">
              {t.investigate.results.targetLabel}
            </span>
            <p className="text-sm font-mono text-cyan-300 break-all select-all font-semibold print:text-slate-950">
              {isUrl ? urlRecord?.normalizedUrl : 'Suspicious Message Communication'}
            </p>
          </div>

          {/* Threat Assessment & Classification */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/50 print:bg-slate-50 print:border-slate-300 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold print:text-slate-600">
                {t.report.overallAssessment}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                    classification === 'HIGH_RISK' || classification === 'SCAM'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800 print:bg-rose-100 print:text-rose-900'
                      : classification === 'SUSPICIOUS'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800 print:bg-amber-100 print:text-amber-900'
                      : classification === 'LEGITIMATE'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 print:bg-emerald-100 print:text-emerald-900'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 print:bg-slate-200 print:text-slate-800'
                  }`}
                >
                  {classification}
                </span>
                <span className="text-xs font-mono text-slate-300 px-2 py-1 rounded bg-slate-900 border border-slate-800 print:bg-slate-200 print:text-slate-800">
                  {t.report.classificationConfidence}: {confidence}%
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-sans print:text-slate-800">
              {isUrl
                ? urlRecord?.geminiAnalysis.explanation
                : messageRecord?.messageAnalysis.explanation}
            </p>

            {/* Note on Confidence vs Campaign score */}
            <p className="text-[11px] font-mono text-slate-400 border-t border-slate-900 pt-2 print:border-slate-200 print:text-slate-600">
              *{t.report.correlationScoreDisclaimer}
            </p>
          </div>

          {/* Message-Specific Details (Extracted text & detected language) */}
          {isMessage && (
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/40 print:bg-slate-50 print:border-slate-300 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold print:text-slate-600">
                  EXTRACTED MESSAGE EVIDENCE
                </span>
                {messageRecord.messageAnalysis.detectedLanguage && (
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 print:bg-cyan-100 print:text-cyan-900">
                    Detected Language: {messageRecord.messageAnalysis.detectedLanguage}
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-900 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed select-all print:bg-white print:border-slate-300 print:text-slate-950">
                {messageRecord.messageAnalysis.extractedText || 'No text extracted.'}
              </div>

              {messageRecord.messageAnalysis.explanationInDetectedLanguage && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-sans text-cyan-300 print:bg-slate-100 print:text-slate-900">
                  <span className="font-semibold block font-mono text-[10px] text-slate-400 uppercase">
                    Explanation in {messageRecord.messageAnalysis.detectedLanguage}:
                  </span>
                  {messageRecord.messageAnalysis.explanationInDetectedLanguage}
                </div>
              )}
            </div>
          )}

          {/* Findings & Observed Evidence */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block print:text-slate-600">
              FINDINGS & OBSERVED EVIDENCE
            </span>

            {isUrl && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 print:bg-slate-50 print:border-slate-300 space-y-1.5">
                  <span className="text-rose-400 font-mono font-semibold block print:text-rose-800">
                    Suspicious Indicators ({urlRecord?.geminiAnalysis.suspiciousSignals.length})
                  </span>
                  {urlRecord?.geminiAnalysis.suspiciousSignals.length ? (
                    <ul className="space-y-1">
                      {urlRecord.geminiAnalysis.suspiciousSignals.map((sig, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-400">•</span>
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400">None observed.</p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 print:bg-slate-50 print:border-slate-300 space-y-1.5">
                  <span className="text-emerald-400 font-mono font-semibold block print:text-emerald-800">
                    Benign Indicators ({urlRecord?.geminiAnalysis.benignSignals.length})
                  </span>
                  {urlRecord?.geminiAnalysis.benignSignals.length ? (
                    <ul className="space-y-1">
                      {urlRecord.geminiAnalysis.benignSignals.map((sig, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">•</span>
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400">None observed.</p>
                  )}
                </div>
              </div>
            )}

            {isMessage && messageRecord.messageAnalysis.findings.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 print:bg-slate-50 print:border-slate-300">
                <ul className="space-y-1.5 text-xs text-slate-300 font-sans print:text-slate-800">
                  {messageRecord.messageAnalysis.findings.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Identity & Impersonation Risk (when applicable) */}
          {((isMessage &&
            (messageRecord?.messageAnalysis.impersonationDetected ||
              messageRecord?.messageAnalysis.identityTheftRisk !== 'LOW' ||
              messageRecord?.messageAnalysis.sensitiveInformationRequested.length > 0)) ||
            (isUrl && urlRecord?.geminiAnalysis.identityConsistency !== 'Consistent')) && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 print:bg-slate-50 print:border-slate-300 space-y-2 text-xs">
              <span className="font-mono uppercase tracking-wider text-rose-400 font-semibold block print:text-rose-800">
                IDENTITY & IMPERSONATION RISK
              </span>
              {isMessage && (
                <div className="space-y-1.5">
                  <p className="text-slate-300 print:text-slate-800">
                    Identity Theft Risk Assessment:{' '}
                    <span className="font-bold text-rose-400 font-mono print:text-rose-800">
                      {messageRecord.messageAnalysis.identityTheftRisk}
                    </span>
                  </p>
                  {messageRecord.messageAnalysis.sensitiveInformationRequested.length > 0 && (
                    <p className="text-slate-300 print:text-slate-800">
                      Sensitive Data Requested:{' '}
                      <span className="text-rose-300 font-mono font-semibold print:text-rose-900">
                        {messageRecord.messageAnalysis.sensitiveInformationRequested.join(', ')}
                      </span>
                    </p>
                  )}
                  {messageRecord.messageAnalysis.identityRiskFindings.map((finding, idx) => (
                    <p key={idx} className="text-slate-400 text-[11px] print:text-slate-600">
                      • {finding}
                    </p>
                  ))}
                </div>
              )}
              {isUrl && (
                <div className="space-y-1 text-slate-300 print:text-slate-800">
                  <p>
                    Claimed Organization: <span className="font-semibold">{urlRecord?.geminiAnalysis.claimedOrganization}</span>
                  </p>
                  <p>
                    Identity Consistency: <span className="font-semibold">{urlRecord?.geminiAnalysis.identityConsistency}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Extracted URLs (when present in message investigation) */}
          {isMessage && messageRecord?.extractedUrls && messageRecord.extractedUrls.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 print:bg-slate-50 print:border-slate-300 space-y-2 text-xs font-mono">
              <span className="uppercase tracking-wider text-cyan-400 font-semibold block print:text-cyan-800">
                EXTRACTED LINKS IN MESSAGE ({messageRecord.extractedUrls.length})
              </span>
              <ul className="space-y-1">
                {messageRecord.extractedUrls.map((link, idx) => (
                  <li key={idx} className="text-slate-300 break-all select-all print:text-slate-900">
                    • {link}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Campaign Connections (if available for URL investigation) */}
          {isUrl && urlRecord?.campaignMatches && urlRecord.campaignMatches.length > 0 && (
            <div className="p-5 rounded-xl border border-cyan-800/60 bg-slate-950/60 print:bg-slate-50 print:border-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-semibold print:text-slate-900">
                  CAMPAIGN CONNECTIONS & CORRELATION
                </span>
                <span className="text-[10px] font-mono text-slate-400 print:text-slate-600">
                  Synthetic Research Dataset
                </span>
              </div>

              {urlRecord.campaignMatches.map((match) => (
                <div
                  key={match.campaignId}
                  className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 print:bg-white print:border-slate-300 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-slate-200 print:text-slate-900">
                      Campaign {match.campaignId.replace('camp-', '').toUpperCase()}
                    </span>
                    <span className="text-cyan-300 font-semibold print:text-slate-800">
                      Relationship Strength: {match.score}/100
                    </span>
                  </div>
                  <ul className="space-y-1 text-slate-300 font-sans print:text-slate-800">
                    {match.evidence.map((ev, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Recommended Next Steps */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/40 print:bg-slate-50 print:border-slate-300 space-y-2.5">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block print:text-slate-700">
              RECOMMENDED NEXT STEPS
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300 font-sans print:text-slate-800">
              {isUrl && urlRecord?.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono font-bold">{idx + 1}.</span>
                  <span>{rec}</span>
                </li>
              ))}
              {isMessage && (
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono font-bold">1.</span>
                  <span>{messageRecord?.messageAnalysis.recommendedAction}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Limitations & Synthetic Demo Disclosure */}
          <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1 print:border-slate-300 print:text-slate-600">
            <p className="font-bold">INVESTIGATION LIMITATIONS & DEMONSTRATION DISCLOSURE:</p>
            <p>
              SCAMCHAIN is an AI-powered defensive analysis prototype. Findings represent automated observations and probabilistic risk assessments; they do not constitute definitive legal proof of criminal attribution or identity theft. Campaign clusters use simulated research datasets for forensic demonstration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

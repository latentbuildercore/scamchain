'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Upload,
  AlertCircle,
  Link as LinkIcon,
  X,
  Shield,
  MessageSquare,
  Sparkles,
  FileText,
  RotateCcw,
  Languages,
} from 'lucide-react';
import { InvestigationLoader, STAGES } from './InvestigationLoader';
import { InvestigationResults } from './InvestigationResults';
import { MessageResults } from './MessageResults';
import { InvestigationRecord, MessageInvestigationRecord } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// Screenshot-specific pipeline stages
const SCREENSHOT_STAGES = [
  { step: 1, title: '1. Uploading screenshot', desc: 'Securely receiving image in memory. It is never stored permanently.' },
  { step: 2, title: '2. Reading message', desc: 'Gemini Vision is transcribing visible text, script, and layout from the screenshot.' },
  { step: 3, title: '3. Analyzing content', desc: 'Detecting scam indicators, impersonation, urgency signals, and social-engineering patterns.' },
  { step: 4, title: '4. Checking for links', desc: 'Identifying any URLs found in the message for optional follow-up investigation.' },
  { step: 5, title: '5. Preparing risk assessment', desc: 'Synthesizing all findings into a clear, actionable message risk report.' },
];

// Text message pipeline stages
const TEXT_STAGES = [
  { step: 1, title: '1. Ingesting message', desc: 'Parsing message text and detecting language (English, Hindi, Hinglish, Kannada, Tamil, Telugu).' },
  { step: 2, title: '2. Threat & linguistic analysis', desc: 'Analyzing claims, fake KYC warnings, OTP requests, financial demands, and humor/satire context.' },
  { step: 3, title: '3. Extracting links', desc: 'Scanning message content for embedded URLs and domains.' },
  { step: 4, title: '4. Preparing risk assessment', desc: 'Synthesizing evidence into an explainable plain-English threat assessment.' },
];

const MAX_MESSAGE_LENGTH = 5000;

export function InvestigationForm() {
  const { t, handleAutoDetectedLanguage } = useLanguage();
  const [mode, setMode] = useState<'url' | 'text' | 'screenshot'>('url');
  const [url, setUrl] = useState('');
  const [messageText, setMessageText] = useState('');
  const [contextText, setContextText] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [activeStage, setActiveStage] = useState(1);
  const [failedStage, setFailedStage] = useState<number | null>(null);
  const [stageWarning, setStageWarning] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [investigationResult, setInvestigationResult] = useState<InvestigationRecord | null>(null);
  const [messageResult, setMessageResult] = useState<MessageInvestigationRecord | null>(null);

  const stageTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Check URL query parameters for prefilling on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('url');
      if (urlParam) {
        setUrl(urlParam);
        setMode('url');
      }
    }
  }, []);

  // Suggested website test targets
  const suggestedTargets = [
    { label: 'Example Domain (Benign)', url: 'https://example.com' },
    { label: 'Wikipedia (Verified Host)', url: 'https://wikipedia.org' },
    { label: 'Cloudflare (Infrastructure)', url: 'https://cloudflare.com' },
    { label: 'C-17 Synthetic Test (Demo)', url: 'https://uniswap-demo.invalid' },
  ];

  // Suggested message test presets (multilingual & humor examples)
  const messagePresets = [
    {
      label: 'Michael Jackson Joke',
      text: 'yo bro am michael jackson send me 10000',
    },
    {
      label: 'Hinglish Bank KYC (Suspicious)',
      text: 'Aapka bank account block ho jayega. Please update KYC immediately at http://bank-kyc-update.online/verify',
    },
    {
      label: 'Hindi Account Alert',
      text: 'प्रिय ग्राहक, आपका बैंक खाता 24 घंटे में बंद कर दिया जाएगा। तुरंत अपना पैन और आधार कार्ड लिंक करें।',
    },
    {
      label: 'Kannada Bank Warning',
      text: 'ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆ ಬ್ಲಾಕ್ ಆಗಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ http://karnataka-bank-verify.site',
    },
    {
      label: 'Tamil Account Notice',
      text: 'உங்கள் கணக்கு முடக்கப்படும். உடனே சரிபார்க்கவும்.',
    },
    {
      label: 'Telugu Account Alert',
      text: 'మీ ఖాతా బ్లాక్ అవుతుంది. వెంటనే లాగిన్ అవ్వండి http://telugu-bank-alert.xyz',
    },
    {
      label: 'Legitimate Meeting Note',
      text: 'Hey Priya, are we still meeting for lunch tomorrow at 1 PM to discuss the project?',
    },
  ];

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image file must be under 5 MB.');
        return;
      }
      setScreenshot(file);
      const objectUrl = URL.createObjectURL(file);
      setScreenshotPreview(objectUrl);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image file must be under 5 MB.');
        return;
      }
      setScreenshot(file);
      const objectUrl = URL.createObjectURL(file);
      setScreenshotPreview(objectUrl);
      setErrorMessage(null);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview(null);
    }
  };

  const clearTimers = () => {
    stageTimerRef.current.forEach((t) => clearTimeout(t));
    stageTimerRef.current = [];
  };

  // 1. Submit Website URL Investigation
  const handleUrlSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      setErrorMessage('Please enter a website URL to investigate.');
      return;
    }

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      new URL(cleanUrl);
    } catch {
      setErrorMessage('Please enter a valid web URL format (e.g., https://example.com).');
      return;
    }

    clearTimers();
    setUrl(cleanUrl);
    setErrorMessage(null);
    setStageWarning(null);
    setFailedStage(null);
    setIsInvestigating(true);
    setActiveStage(1);

    const t2 = setTimeout(() => setActiveStage(2), 350);
    const t3 = setTimeout(() => setActiveStage(3), 800);
    const t4 = setTimeout(() => setActiveStage(4), 1400);
    const t5 = setTimeout(() => setActiveStage(5), 2000);
    const t6 = setTimeout(() => setActiveStage(6), 2600);
    const t7 = setTimeout(() => setActiveStage(7), 3100);

    stageTimerRef.current = [t2, t3, t4, t5, t6, t7];

    try {
      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cleanUrl,
          context: contextText || undefined,
        }),
      });

      clearTimers();
      const json = await response.json();

      if (!response.ok || !json.success) {
        setFailedStage(activeStage);
        setErrorMessage(json.error || `Server returned error status ${response.status}`);
        return;
      }

      setActiveStage(8);
      const record: InvestigationRecord = json.data;

      if (record.observedSignals.rawFetchError) {
        setStageWarning(`Observed Notice: ${record.observedSignals.rawFetchError}`);
      }

      setTimeout(() => {
        setIsInvestigating(false);
        setInvestigationResult(record);
      }, 400);
    } catch (err: unknown) {
      clearTimers();
      const message = err instanceof Error ? err.message : String(err);
      setFailedStage(activeStage);
      setErrorMessage(`Investigation request failed: ${message}`);
    }
  };

  // 2. Submit Pasted Text Message Investigation (Feature 1 & Feature 2)
  const handleTextMessageSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) {
      setErrorMessage('Please enter or paste a message to analyze.');
      return;
    }

    if (messageText.length > MAX_MESSAGE_LENGTH) {
      setErrorMessage(`Message exceeds maximum limit of ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    clearTimers();
    setErrorMessage(null);
    setStageWarning(null);
    setFailedStage(null);
    setIsInvestigating(true);
    setActiveStage(1);

    const t2 = setTimeout(() => setActiveStage(2), 450);
    const t3 = setTimeout(() => setActiveStage(3), 1100);
    const t4 = setTimeout(() => setActiveStage(4), 1900);
    stageTimerRef.current = [t2, t3, t4];

    try {
      const response = await fetch('/api/investigate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText.trim(),
          context: contextText.trim() || undefined,
        }),
      });

      clearTimers();
      const json = await response.json();

      if (!response.ok || !json.success) {
        setFailedStage(activeStage);
        setErrorMessage(json.error || `Server returned error status ${response.status}`);
        return;
      }

      setTimeout(() => {
        setIsInvestigating(false);
        setMessageResult(json.data);
        if (json.data?.messageAnalysis?.detectedLanguage) {
          handleAutoDetectedLanguage(json.data.messageAnalysis.detectedLanguage);
        }
      }, 400);
    } catch (err: unknown) {
      clearTimers();
      const message = err instanceof Error ? err.message : String(err);
      setFailedStage(activeStage);
      setErrorMessage(`Message analysis failed: ${message}`);
    }
  };

  // 3. Submit Screenshot Investigation
  const handleScreenshotSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!screenshot) {
      setErrorMessage('Please upload a screenshot image to analyze.');
      return;
    }

    clearTimers();
    setErrorMessage(null);
    setStageWarning(null);
    setFailedStage(null);
    setIsInvestigating(true);
    setActiveStage(1);

    const t2 = setTimeout(() => setActiveStage(2), 500);
    const t3 = setTimeout(() => setActiveStage(3), 1200);
    const t4 = setTimeout(() => setActiveStage(4), 2200);
    const t5 = setTimeout(() => setActiveStage(5), 3200);
    stageTimerRef.current = [t2, t3, t4, t5];

    try {
      const formData = new FormData();
      formData.append('image', screenshot);
      if (contextText.trim()) {
        formData.append('context', contextText.trim());
      }

      const response = await fetch('/api/investigate-screenshot', {
        method: 'POST',
        body: formData,
      });

      clearTimers();
      const json = await response.json();

      if (!response.ok || !json.success) {
        setFailedStage(activeStage);
        setErrorMessage(json.error || `Server returned error status ${response.status}`);
        return;
      }

      setTimeout(() => {
        setIsInvestigating(false);
        setMessageResult(json.data);
        if (json.data?.messageAnalysis?.detectedLanguage) {
          handleAutoDetectedLanguage(json.data.messageAnalysis.detectedLanguage);
        }
      }, 400);
    } catch (err: unknown) {
      clearTimers();
      const message = err instanceof Error ? err.message : String(err);
      setFailedStage(activeStage);
      setErrorMessage(`Screenshot analysis failed: ${message}`);
    }
  };

  const handleReset = () => {
    clearTimers();
    setIsInvestigating(false);
    setInvestigationResult(null);
    setMessageResult(null);
    setUrl('');
    setMessageText('');
    setContextText('');
    handleRemoveScreenshot();
    setErrorMessage(null);
    setStageWarning(null);
    setFailedStage(null);
    setActiveStage(1);
  };

  if (investigationResult) {
    return <InvestigationResults record={investigationResult} onReset={handleReset} />;
  }

  if (messageResult) {
    return (
      <MessageResults
        record={messageResult}
        screenshotPreviewUrl={screenshotPreview}
        onReset={handleReset}
      />
    );
  }

  if (isInvestigating) {
    const loaderStages =
      mode === 'url' ? STAGES : mode === 'text' ? TEXT_STAGES : SCREENSHOT_STAGES;
    const loaderTarget =
      mode === 'url'
        ? url
        : mode === 'text'
        ? messageText.slice(0, 50) + (messageText.length > 50 ? '...' : '')
        : screenshot?.name || 'Screenshot Image';

    return (
      <InvestigationLoader
        url={loaderTarget}
        activeStage={activeStage}
        failedStage={failedStage}
        stageWarning={stageWarning}
        errorMessage={errorMessage}
        onReset={handleReset}
        stages={loaderStages}
      />
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Investigation Mode Selector Tabs — 3 Modes (Feature 1) */}
      <div
        role="tablist"
        aria-label={t.common.selectLanguage || "Investigation mode"}
        className="grid grid-cols-3 gap-1.5 p-1.5 rounded-xl bg-slate-950/80 border border-slate-800"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'url'}
          onClick={() => {
            setMode('url');
            setErrorMessage(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all ${
            mode === 'url'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t.investigate.modes.url}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === 'text'}
          onClick={() => {
            setMode('text');
            setErrorMessage(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all ${
            mode === 'text'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t.investigate.modes.text}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === 'screenshot'}
          onClick={() => {
            setMode('screenshot');
            setErrorMessage(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all ${
            mode === 'screenshot'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t.investigate.modes.screenshot}</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="card-glass rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Header Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <h2 className="text-xs sm:text-sm font-mono font-semibold text-slate-200 uppercase tracking-wider">
              {mode === 'url'
                ? t.investigate.form.urlHeader
                : mode === 'text'
                ? t.investigate.form.textHeader
                : t.investigate.form.screenshotHeader}
            </h2>
          </div>
          <span className="self-start sm:self-auto text-[10px] sm:text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-0.5 rounded-full font-medium">
            {mode === 'url'
              ? 'MULTI-SIGNAL DNA ANALYSIS'
              : mode === 'text'
              ? 'INDIAN-LANGUAGE & HUMOR AI'
              : 'MULTIMODAL AI FORENSICS'}
          </span>
        </div>

        {/* ================= MODE 1: WEBSITE / URL ================= */}
        {mode === 'url' && (
          <form onSubmit={handleUrlSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="target-url"
                className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider"
              >
                {t.investigate.form.urlLabel} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <input
                  id="target-url"
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder={t.investigate.form.urlPlaceholder}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/90 pl-11 pr-32 sm:pr-36 py-3.5 sm:py-4 text-xs sm:text-base font-mono text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all shadow-inner"
                />
                <div className="absolute inset-y-1.5 right-1.5 sm:inset-y-2 sm:right-2 flex items-center">
                  <button
                    type="submit"
                    className="h-full px-3.5 sm:px-5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs sm:text-sm font-mono font-bold hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{t.common.investigate}</span>
                  </button>
                </div>
              </div>

              {errorMessage && (
                <p className="flex items-center gap-1.5 text-xs font-mono text-rose-400 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </p>
              )}

              {/* Suggested Harmless Test Targets */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">{t.investigate.form.samplesLabel}</span>
                {suggestedTargets.map((target) => (
                  <button
                    key={target.url}
                    type="button"
                    onClick={() => {
                      setUrl(target.url);
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                  >
                    {target.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Context */}
            <div className="space-y-2">
              <label
                htmlFor="investigation-context"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                {t.investigate.form.contextLabel}
              </label>
              <textarea
                id="investigation-context"
                rows={3}
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder={t.investigate.form.contextPlaceholder}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs sm:text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all resize-y min-h-[80px]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-sm font-mono font-bold hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-lg shadow-cyan-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{t.investigate.form.submitUrl}</span>
            </button>
          </form>
        )}

        {/* ================= MODE 2: MESSAGE TEXT (Feature 1 & Feature 2) ================= */}
        {mode === 'text' && (
          <form onSubmit={handleTextMessageSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="message-text"
                  className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider"
                >
                  {t.investigate.form.textLabel} <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[11px] font-mono ${
                      messageText.length > MAX_MESSAGE_LENGTH ? 'text-rose-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {messageText.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()} {t.investigate.form.characterLimit}
                  </span>
                  {messageText.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMessageText('');
                        setErrorMessage(null);
                      }}
                      className="text-[11px] font-mono text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t.common.clear}</span>
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400 font-sans">
                {t.investigate.form.textSubtitle}
              </p>

              <textarea
                id="message-text"
                rows={5}
                value={messageText}
                maxLength={MAX_MESSAGE_LENGTH + 100}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={t.investigate.form.textPlaceholder}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/90 p-4 text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all resize-y min-h-[120px]"
              />

              {errorMessage && (
                <p className="flex items-center gap-1.5 text-xs font-mono text-rose-400 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </p>
              )}

              {/* Sample Test Lures */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <Languages className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.investigate.form.sampleMessagesLabel}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {messagePresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setMessageText(preset.text);
                        setErrorMessage(null);
                      }}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Context */}
            <div className="space-y-2">
              <label
                htmlFor="text-context"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                {t.investigate.form.contextLabel}
              </label>
              <textarea
                id="text-context"
                rows={2}
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder={t.investigate.form.contextPlaceholder}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs sm:text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all resize-y min-h-[60px]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!messageText.trim()}
              className={`w-full py-3.5 rounded-xl font-mono font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                messageText.trim()
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-950/40 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.investigate.form.submitText}</span>
            </button>
          </form>
        )}

        {/* ================= MODE 3: SCREENSHOT ================= */}
        {mode === 'screenshot' && (
          <form onSubmit={handleScreenshotSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                {t.investigate.form.screenshotLabel} <span className="text-rose-400">*</span>
              </label>
              <p className="text-xs text-slate-400 font-sans">
                {t.investigate.form.textSubtitle}
              </p>

              {!screenshotPreview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="relative border-2 border-dashed border-slate-800 hover:border-cyan-700/60 rounded-xl p-8 text-center transition-colors bg-slate-950/50 group"
                >
                  <input
                    id="screenshot-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleScreenshotChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Upload screenshot"
                  />
                  <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-cyan-400 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-mono text-slate-300">
                      <span className="text-cyan-400 font-semibold">[{t.investigate.form.screenshotBrowse}]</span> {t.investigate.form.screenshotDropText}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {t.investigate.form.screenshotHint}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-700 bg-slate-900/80">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={screenshotPreview}
                        alt="Screenshot preview thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-medium text-slate-200 truncate max-w-xs sm:max-w-md">
                        {screenshot?.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {screenshot ? `${(screenshot.size / 1024).toFixed(1)} KB` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveScreenshot}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label={t.investigate.form.removeScreenshot}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {errorMessage && (
                <p className="flex items-center gap-1.5 text-xs font-mono text-rose-400 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </p>
              )}
            </div>

            {/* Optional Context */}
            <div className="space-y-2">
              <label
                htmlFor="screenshot-context"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                {t.investigate.form.contextLabel}
              </label>
              <textarea
                id="screenshot-context"
                rows={2}
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder={t.investigate.form.contextPlaceholder}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs sm:text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all resize-y min-h-[60px]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!screenshot}
              className={`w-full py-3.5 rounded-xl font-mono font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                screenshot
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-950/40 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.investigate.form.submitScreenshot}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

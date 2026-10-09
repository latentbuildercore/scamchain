'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SupportedLocale } from '@/lib/i18n/types';
import { Languages, Check, ChevronDown, Sparkles } from 'lucide-react';

export function LanguageSelector() {
  const {
    locale,
    setLocale,
    isAutoDetectEnabled,
    enableAutoDetect,
    supportedLocales,
    t,
  } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentMeta = supportedLocales[locale] || supportedLocales.en;
  const currentLabel = isAutoDetectEnabled
    ? `Auto: ${currentMeta.nativeName}`
    : currentMeta.nativeName;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-mono transition-colors shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
          isAutoDetectEnabled
            ? 'border-cyan-800/80 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-900/50'
            : 'border-slate-800 bg-slate-900/90 text-slate-200 hover:border-slate-700 hover:bg-slate-800/90'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select display language, current is ${currentLabel}`}
      >
        {isAutoDetectEnabled ? (
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        ) : (
          <Languages className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        )}
        <span className="font-semibold text-slate-100">{currentLabel}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Supported languages"
          className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-800 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-fade-in focus:outline-none"
        >
          {/* 1. Automatic Detection Option */}
          <button
            role="option"
            aria-selected={isAutoDetectEnabled}
            type="button"
            onClick={() => {
              enableAutoDetect();
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer text-left ${
              isAutoDetectEnabled
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-bold'
                : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-slate-100 font-semibold">
                  {t.common.autoDetect || 'Automatic detection'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Detect from message or screenshot
                </span>
              </div>
            </div>
            {isAutoDetectEnabled && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
          </button>

          <div className="my-1 border-t border-slate-800/80" />

          {/* 2. Specific Supported Languages */}
          <div className="space-y-0.5">
            {Object.values(supportedLocales).map((meta) => {
              const isSelected = !isAutoDetectEnabled && meta.code === locale;
              return (
                <button
                  key={meta.code}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => {
                    setLocale(meta.code as SupportedLocale, true);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-bold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-slate-100 font-semibold">{meta.nativeName}</span>
                    <span className="text-[10px] text-slate-400">{meta.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

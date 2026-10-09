'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SupportedLocale, TranslationDictionary, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './types';
import { getDictionary, mapDetectedLanguageToLocale } from './index';

interface LanguageContextType {
  locale: SupportedLocale;
  t: TranslationDictionary;
  setLocale: (newLocale: SupportedLocale, isManual?: boolean) => void;
  isAutoDetectEnabled: boolean;
  setAutoDetectEnabled: (enabled: boolean) => void;
  enableAutoDetect: () => void;
  /**
   * Called when a message or screenshot analysis completes with a detected language.
   * If auto-detect is enabled and the language is recognized, seamlessly switches the interface.
   * Returns the new locale if switched, or null.
   */
  handleAutoDetectedLanguage: (detectedLanguage: string | null | undefined) => SupportedLocale | null;
  supportedLocales: typeof SUPPORTED_LOCALES;
}

const STORAGE_KEY_LOCALE = 'scamchain_user_locale';
const STORAGE_KEY_AUTODETECT = 'scamchain_autodetect_enabled';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Deterministic hydration-safe defaults identical on server and initial client render
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [isAutoDetectEnabled, setAutoDetectEnabledState] = useState<boolean>(true);

  // Restore persisted language preference or browser locale after initial hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedLocale = localStorage.getItem(STORAGE_KEY_LOCALE) as SupportedLocale | null;
        const savedAuto = localStorage.getItem(STORAGE_KEY_AUTODETECT);

        let isAuto = true;
        if (savedAuto !== null) {
          isAuto = savedAuto === 'true';
          setAutoDetectEnabledState(isAuto);
        }

        if (savedLocale && savedLocale in SUPPORTED_LOCALES) {
          setLocaleState(savedLocale);
        } else if (isAuto && typeof navigator !== 'undefined' && navigator.language) {
          const browserLang = navigator.language.slice(0, 2).toLowerCase();
          if (browserLang === 'hi') setLocaleState('hi');
          else if (browserLang === 'kn') setLocaleState('kn');
          else if (browserLang === 'ta') setLocaleState('ta');
          else if (browserLang === 'te') setLocaleState('te');
        }
      } catch {
        // Fallback to default in restricted or private browsing modes
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Keep HTML lang and dir attributes synchronized
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const meta = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES.en;
      document.documentElement.lang = meta.code;
      document.documentElement.dir = meta.direction;
    }
  }, [locale]);

  // Manual selection switches the interface and locks manual mode so auto-detect does not override it
  const setLocale = useCallback((newLocale: SupportedLocale, isManual: boolean = true) => {
    if (newLocale in SUPPORTED_LOCALES) {
      setLocaleState(newLocale);
      if (isManual) {
        setAutoDetectEnabledState(false);
      }
      try {
        localStorage.setItem(STORAGE_KEY_LOCALE, newLocale);
        if (isManual) {
          localStorage.setItem(STORAGE_KEY_AUTODETECT, 'false');
        }
      } catch {
        // Ignore storage exceptions
      }
    }
  }, []);

  const setAutoDetectEnabled = useCallback((enabled: boolean) => {
    setAutoDetectEnabledState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY_AUTODETECT, String(enabled));
    } catch {
      // Ignore storage exceptions
    }
  }, []);

  const enableAutoDetect = useCallback(() => {
    setAutoDetectEnabledState(true);
    try {
      localStorage.setItem(STORAGE_KEY_AUTODETECT, 'true');
    } catch {
      // Ignore storage exceptions
    }
  }, []);

  const handleAutoDetectedLanguage = useCallback(
    (detectedLanguage: string | null | undefined): SupportedLocale | null => {
      // Never override when user has manually locked a language preference
      if (!isAutoDetectEnabled) return null;
      const mapped = mapDetectedLanguageToLocale(detectedLanguage);
      if (mapped && mapped !== locale) {
        setLocaleState(mapped);
        try {
          localStorage.setItem(STORAGE_KEY_LOCALE, mapped);
        } catch {
          // Ignore storage exceptions
        }
        return mapped;
      }
      return null;
    },
    [isAutoDetectEnabled, locale]
  );

  const t = useMemo(() => getDictionary(locale), [locale]);

  const value = useMemo(
    () => ({
      locale,
      t,
      setLocale,
      isAutoDetectEnabled,
      setAutoDetectEnabled,
      enableAutoDetect,
      handleAutoDetectedLanguage,
      supportedLocales: SUPPORTED_LOCALES,
    }),
    [locale, t, setLocale, isAutoDetectEnabled, setAutoDetectEnabled, enableAutoDetect, handleAutoDetectedLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

import { SupportedLocale, TranslationDictionary } from './types';
import { en } from './locales/en';
import { hi } from './locales/hi';
import { hinglish } from './locales/hinglish';
import { kn } from './locales/kn';
import { ta } from './locales/ta';
import { te } from './locales/te';

export const dictionaries: Record<SupportedLocale, TranslationDictionary> = {
  en,
  hi,
  hinglish,
  kn,
  ta,
  te,
};

/**
 * Maps arbitrary detected language strings (from AI or heuristic detectors)
 * to a supported SCAMCHAIN interface locale.
 *
 * Examples:
 *   "Hindi" -> "hi"
 *   "Devanagari" -> "hi"
 *   "Hinglish" -> "hinglish"
 *   "Hindi (Romanized)" -> "hinglish"
 *   "Kannada" -> "kn"
 *   "Tamil" -> "ta"
 *   "Telugu" -> "te"
 *   "English" -> "en"
 *   "Mixed (Hindi / English)" -> "hinglish"
 *   "Mixed (Kannada / English)" -> "kn"
 *   "Unknown" -> null (do not switch arbitrarily)
 */
export function mapDetectedLanguageToLocale(detected: string | null | undefined): SupportedLocale | null {
  if (!detected) return null;
  const lower = detected.toLowerCase().trim();

  // 1. Hinglish / Mixed Hindi-English
  if (
    lower.includes('hinglish') ||
    (lower.includes('hindi') && (lower.includes('roman') || lower.includes('mixed') || lower.includes('latn')))
  ) {
    return 'hinglish';
  }

  // 2. Hindi
  if (lower.includes('hindi') || lower.includes('devanagari')) {
    return 'hi';
  }

  // 3. Kannada
  if (lower.includes('kannada') || lower.includes('knda')) {
    return 'kn';
  }

  // 4. Tamil
  if (lower.includes('tamil') || lower.includes('taml')) {
    return 'ta';
  }

  // 5. Telugu
  if (lower.includes('telugu') || lower.includes('telu')) {
    return 'te';
  }

  // 6. English
  if (lower.includes('english')) {
    return 'en';
  }

  // Ambiguous or unsupported language — return null so caller keeps current locale
  return null;
}

/**
 * Retrieves translation dictionary for a given locale with fallback to English.
 */
export function getDictionary(locale: SupportedLocale): TranslationDictionary {
  return dictionaries[locale] || dictionaries.en;
}

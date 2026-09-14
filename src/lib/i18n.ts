export type Locale = 'ru';
export interface LocaleMeta { id: Locale; label: string; verified: boolean }

// A locale is exposed to users only after the whole interface has been reviewed in that language.
// Russian is the only fully reviewed interface in this build. New locales can be registered here
// after every route, system message, exercise shell and setting has been translated and checked.
export const AVAILABLE_LOCALES: LocaleMeta[] = [
  { id: 'ru', label: 'Русский', verified: true },
];

const LOCALE_KEY = 'otto-a1-interface-locale';

export function getLocale(): Locale {
  try {
    const value = localStorage.getItem(LOCALE_KEY);
    return AVAILABLE_LOCALES.some((locale) => locale.verified && locale.id === value) ? value as Locale : 'ru';
  } catch { return 'ru'; }
}

export function setLocale(locale: Locale) {
  if (!AVAILABLE_LOCALES.some((item) => item.id === locale && item.verified)) return;
  try { localStorage.setItem(LOCALE_KEY, locale); } catch { /* ignore */ }
  document.documentElement.lang = locale;
  window.dispatchEvent(new CustomEvent('otto:locale-changed', { detail: locale }));
}

export function initializeLocale() {
  document.documentElement.lang = getLocale();
}

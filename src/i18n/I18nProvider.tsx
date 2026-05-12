"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_HTML_LANG,
  Locale,
  STORAGE_KEY,
  isLocale,
} from "./config";
import en from "./locales/en";
import ja from "./locales/ja";
import ko, { Translation } from "./locales/ko";
import zh from "./locales/zh";

type Section = keyof Translation;
type Key<S extends Section> = keyof Translation[S];

const dictionaries: Record<Locale, Translation> = { ko, zh, ja, en };

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: <S extends Section>(
    section: S,
    key: Key<S>,
    vars?: Record<string, string | number>,
  ) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const value = vars[name];
    return value === undefined ? `{${name}}` : String(value);
  });
}

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  const navLang = window.navigator.language.toLowerCase();
  if (navLang.startsWith("zh")) return "zh";
  if (navLang.startsWith("ja")) return "ja";
  if (navLang.startsWith("ko")) return "ko";
  if (navLang.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(detectInitialLocale());
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = LOCALE_HTML_LANG[locale];
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[locale];
    return {
      locale,
      setLocale,
      t: (section, key, vars) => {
        const sectionDict = dict[section] as Record<string, string>;
        const template = sectionDict[key as string];
        return interpolate(template, vars);
      },
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useTranslation() {
  return useI18n().t;
}

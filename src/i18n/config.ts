export const LOCALES = ["ko", "zh", "ja", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ko";

export const STORAGE_KEY = "daiso-finder.locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  ko: "한국어",
  zh: "中文",
  ja: "日本語",
  en: "English",
};

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  ko: "ko-KR",
  zh: "zh-CN",
  ja: "ja-JP",
  en: "en-US",
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

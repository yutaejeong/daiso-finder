"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { LOCALES, LOCALE_LABELS, Locale } from "@/i18n/config";
import { trackEvent } from "@/lib/gtag";
import { css } from "@styled-system/css";
import { IconLanguage } from "@tabler/icons-react";
import clsx from "clsx";

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
  const label = t("common", "languageSelectorLabel");

  return (
    <label
      className={clsx(
        "input-group",
        css({
          width: "auto",
          alignSelf: "flex-end",
          marginBottom: "12px",
        }),
      )}
      aria-label={label}
    >
      <span
        className={clsx(
          "input-group-text",
          css({ padding: "4px 8px" }),
        )}
        aria-hidden="true"
      >
        <IconLanguage width={18} height={18} />
      </span>
      <select
        className={clsx(
          "form-select",
          css({
            paddingY: "4px",
            paddingX: "8px",
            fontSize: "0.875rem",
            width: "auto",
          }),
        )}
        value={locale}
        onChange={(event) => {
          const next = event.target.value as Locale;
          setLocale(next);
          trackEvent("language_change", { locale: next });
        }}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}

"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { css } from "@styled-system/css";
import { IconLocation, IconSearch } from "@tabler/icons-react";
import clsx from "clsx";
import { ReactNode } from "react";

interface SearchProps {
  title: string;
  placeholder: string;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  isFetching?: boolean;
  hasResults?: boolean;
  keyword?: string;
  withLocation?: boolean;
}

export function Search({
  title,
  placeholder,
  searchInput,
  onSearchInputChange,
  onSubmit,
  children,
  isFetching,
  hasResults,
  keyword,
  withLocation = false,
}: SearchProps) {
  const { t } = useI18n();
  return (
    <>
      <span
        className={clsx(
          "text-muted",
          css({
            fontSize: "1.1rem",
            marginBottom: "8px",
          }),
        )}
      >
        {title}
      </span>
      <form
        className={clsx("input-group", css({ marginBottom: "12px" }))}
        onSubmit={onSubmit}
      >
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
        />
        <button
          className="btn btn-red"
          type="submit"
          name="action"
          value="keyword"
        >
          <IconSearch width={20} height={20} />
        </button>
        {withLocation && (
          <button
            className="btn btn-red"
            name="action"
            value="location"
            type="submit"
          >
            <IconLocation width={20} height={20} />
          </button>
        )}
      </form>
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          overflowY: "auto",
          overflowX: "hidden",
          flex: 1,
          padding: "8px",
          border: "1px solid #ccc",
          backgroundColor: "#f8f8f8",
          borderRadius: "4px",
        })}
      >
        {children}
        {!hasResults && (
          <div
            className={clsx(
              "text-muted",
              css({ textAlign: "center", marginTop: "16px" }),
            )}
          >
            {isFetching
              ? t("search", "searching")
              : keyword
                ? t("search", "noResults")
                : t("search", "promptInput")}
          </div>
        )}
      </div>
    </>
  );
}

"use client";

import { css } from "@styled-system/css";
import {
  IconAlertCircle,
  IconLocation,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";
import clsx from "clsx";
import { ReactNode, useId } from "react";

interface SearchProps {
  title: string;
  placeholder: string;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  beforeForm?: ReactNode;
  isFetching?: boolean;
  hasResults?: boolean;
  keyword?: string;
  withLocation?: boolean;
  searchButtonLabel?: string;
  locationButtonLabel?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

export function Search({
  title,
  placeholder,
  searchInput,
  onSearchInputChange,
  onSubmit,
  children,
  beforeForm,
  isFetching,
  hasResults,
  keyword,
  withLocation = false,
  searchButtonLabel = "검색",
  locationButtonLabel = "현재 위치로 검색",
  errorMessage,
  onRetry,
}: SearchProps) {
  const inputId = useId();
  const hasError = Boolean(errorMessage);
  const statusMessage = isFetching
    ? "검색 중..."
    : keyword
      ? "검색 결과가 없습니다"
      : "검색어를 입력해주세요";

  return (
    <>
      <label
        htmlFor={inputId}
        className={clsx(
          "text-muted",
          css({
            fontSize: "1.1rem",
            marginBottom: "8px",
          }),
        )}
      >
        {title}
      </label>
      {beforeForm}
      <form
        className={clsx("input-group", css({ marginBottom: "12px" }))}
        onSubmit={onSubmit}
        role="search"
      >
        <input
          id={inputId}
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
          aria-label={searchButtonLabel}
        >
          <IconSearch aria-hidden="true" width={20} height={20} />
        </button>
        {withLocation && (
          <button
            className="btn btn-red"
            name="action"
            value="location"
            type="submit"
            aria-label={locationButtonLabel}
          >
            <IconLocation aria-hidden="true" width={20} height={20} />
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
        {!hasError && children}
        {hasError ? (
          <div
            role="alert"
            className={css({
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              textAlign: "center",
              padding: "28px 16px",
              color: "#4a4a4a",
            })}
          >
            <IconAlertCircle
              aria-hidden="true"
              width={34}
              height={34}
              className={css({ color: "#ED1C24" })}
            />
            <p className={css({ margin: 0, lineHeight: 1.5 })}>
              {errorMessage}
            </p>
            {onRetry && (
              <button type="button" onClick={onRetry} className="btn btn-red">
                <IconRefresh aria-hidden="true" width={18} height={18} />
                다시 시도
              </button>
            )}
          </div>
        ) : (
          !hasResults && (
            <div
              role="status"
              aria-live="polite"
              className={clsx(
                "text-muted",
                css({ textAlign: "center", marginTop: "16px" }),
              )}
            >
              {statusMessage}
            </div>
          )
        )}
      </div>
    </>
  );
}

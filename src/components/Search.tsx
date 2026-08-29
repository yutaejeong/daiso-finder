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
import { useScrollRestoration } from "@/hooks/useScrollRestoration";

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
  toolName?: string;
  toolDescription?: string;
  toolParamDescription?: string;
  /** 검색 진행률(0~100). 진행률을 알 수 없으면 undefined */
  progressPercent?: number;
  /** 진행률 옆에 함께 보여줄 보조 설명 */
  progressLabel?: string;
  /**
   * 결과 목록의 스크롤 위치를 기억할 키. 검색 조건마다 다른 값을 주면
   * 뒤로가기로 돌아왔을 때 보고 있던 위치가 복원된다.
   */
  scrollRestorationKey?: string | null;
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
  toolName,
  toolDescription,
  toolParamDescription,
  progressPercent,
  progressLabel,
  scrollRestorationKey = null,
}: SearchProps) {
  const inputId = useId();
  const resultsRef = useScrollRestoration<HTMLDivElement>(scrollRestorationKey);
  const hasError = Boolean(errorMessage);
  const clampedPercent =
    typeof progressPercent === "number"
      ? Math.max(0, Math.min(100, Math.round(progressPercent)))
      : 0;
  const showProgress =
    Boolean(isFetching) && typeof progressPercent === "number";
  const statusMessage = isFetching
    ? showProgress
      ? `검색 중... ${clampedPercent}%`
      : "검색 중..."
    : keyword
      ? "검색 결과가 없습니다"
      : "검색어를 입력해주세요";
  const webMcpFormAttributes =
    toolName && toolDescription
      ? ({
          toolname: toolName,
          tooldescription: toolDescription,
          toolautosubmit: "",
        } satisfies Record<string, string>)
      : undefined;
  const webMcpInputAttributes = toolParamDescription
    ? ({
        toolparamdescription: toolParamDescription,
      } satisfies Record<string, string>)
    : undefined;

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
        {...webMcpFormAttributes}
        className={clsx("input-group", css({ marginBottom: "12px" }))}
        onSubmit={onSubmit}
        role="search"
      >
        <input
          id={inputId}
          name="keyword"
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          {...webMcpInputAttributes}
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
      {showProgress && (
        <div
          className={css({
            marginBottom: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          })}
        >
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={clampedPercent}
            aria-valuetext={`${clampedPercent}% 완료`}
            aria-label="상품 검색 진행률"
            className={css({
              width: "100%",
              height: "6px",
              borderRadius: "999px",
              backgroundColor: "#e5e5e5",
              overflow: "hidden",
            })}
          >
            <div
              className={css({
                height: "100%",
                borderRadius: "999px",
                backgroundColor: "#c4002f",
                transition: "width 0.25s ease-out",
              })}
              style={{ width: `${clampedPercent}%` }}
            />
          </div>
          <span
            aria-hidden="true"
            className={clsx(
              "text-muted",
              css({
                fontSize: "0.8125rem",
                display: "flex",
                justifyContent: "space-between",
                gap: "8px",
              }),
            )}
          >
            <span>{progressLabel ?? "상품을 찾는 중이에요"}</span>
            <span className={css({ fontVariantNumeric: "tabular-nums" })}>
              {clampedPercent}%
            </span>
          </span>
        </div>
      )}
      <div
        ref={resultsRef}
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

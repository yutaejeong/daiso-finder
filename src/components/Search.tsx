"use client";

import { css } from "@styled-system/css";
import {
  IconAlertCircle,
  IconCurrentLocation,
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
        className={css({
          marginBottom: "8px",
          color: "var(--ink-2)",
          fontSize: "0.875rem",
          fontWeight: 700,
        })}
      >
        {title}
      </label>
      {beforeForm}
      <form
        {...webMcpFormAttributes}
        className={clsx("input-group", css({ marginBottom: "14px" }))}
        onSubmit={onSubmit}
        role="search"
      >
        <input
          id={inputId}
          name="keyword"
          type="text"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="form-control"
          placeholder={placeholder}
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          {...webMcpInputAttributes}
        />
        <button
          className="btn btn-red btn-icon"
          type="submit"
          name="action"
          value="keyword"
          aria-label={searchButtonLabel}
        >
          <IconSearch aria-hidden="true" width={20} height={20} stroke={2.25} />
        </button>
        {withLocation && (
          <button
            className="btn btn-soft btn-icon"
            name="action"
            value="location"
            type="submit"
            aria-label={locationButtonLabel}
          >
            <IconCurrentLocation
              aria-hidden="true"
              width={20}
              height={20}
              stroke={2.25}
            />
          </button>
        )}
      </form>
      {showProgress && (
        <div
          className={css({
            marginBottom: "14px",
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
              backgroundColor: "var(--line)",
              overflow: "hidden",
            })}
          >
            <div
              className={css({
                height: "100%",
                borderRadius: "999px",
                backgroundColor: "var(--brand)",
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
          gap: "10px",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          // 목록 끝에서 더 스크롤해도 뒤의 페이지로 이어지거나 튕기지 않게 한다.
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          // 카드 그림자가 스크롤 영역 가장자리에서 잘리지 않도록 안쪽 여백을 두고
          // 같은 만큼 바깥으로 당겨 폭을 맞춘다.
          margin: "0 -6px",
          padding: "4px 6px 20px",
          // 위아래 가장자리를 부드럽게 지워 스크롤 영역이 잘려 보이지 않게 한다.
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, #000 6px, #000 calc(100% - 20px), transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0, #000 6px, #000 calc(100% - 20px), transparent 100%)",
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
              gap: "12px",
              textAlign: "center",
              padding: "32px 16px",
              color: "var(--ink-2)",
            })}
          >
            <IconAlertCircle
              aria-hidden="true"
              width={36}
              height={36}
              className={css({ color: "var(--brand)" })}
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
                css({
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  textAlign: "center",
                  padding: "40px 16px",
                }),
              )}
            >
              <IconSearch
                aria-hidden="true"
                width={28}
                height={28}
                className={css({ color: "var(--line-strong)" })}
              />
              <span>{statusMessage}</span>
            </div>
          )
        )}
      </div>
    </>
  );
}

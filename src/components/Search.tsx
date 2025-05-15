"use client";

import { css } from "@styled-system/css";
import clsx from "clsx";
import { ReactNode } from "react";

interface SearchProps {
  title: string;
  placeholder: string;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
  isFetching?: boolean;
  hasResults?: boolean;
  keyword?: string;
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
}: SearchProps) {
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
          required
        />
        <button className="btn btn-red" type="submit">
          검색
        </button>
      </form>
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          overflowY: "auto",
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
              ? "검색 중..."
              : keyword
                ? "검색 결과가 없습니다"
                : "검색어를 입력해주세요"}
          </div>
        )}
      </div>
    </>
  );
}

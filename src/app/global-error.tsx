"use client";

import { css } from "@styled-system/css";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./globals.css";

/**
 * 루트 레이아웃까지 깨졌을 때만 나오는 마지막 화면. 레이아웃을 대신하므로
 * `html`, `body` 를 직접 그린다. 이 자리에서 잡지 않으면 어디에도 기록이
 * 남지 않는 오류라서 Sentry 로 꼭 올린다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("치명적 오류:", error);
    Sentry.captureException(error, {
      tags: { boundary: "global-error", error_digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="ko">
      <body className={css({ padding: "24px !important", height: "100dvh" })}>
        <main
          role="alert"
          className={css({
            width: "100%",
            maxWidth: "480px",
            minHeight: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            textAlign: "center",
          })}
        >
          <h1
            className={css({
              fontSize: "1.5rem",
              lineHeight: 1.35,
              wordBreak: "keep-all",
            })}
          >
            잠시 문제가 발생했습니다
          </h1>
          <p className="text-muted">
            페이지를 다시 불러오거나 잠시 후 다시 시도해주세요.
          </p>
          <button type="button" onClick={reset} className="btn btn-red">
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}

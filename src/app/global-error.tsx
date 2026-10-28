"use client";

import { css } from "@styled-system/css";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./globals.css";

/**
 * 루트 레이아웃까지 깨졌을 때만 나오는 마지막 화면. 레이아웃을 대신하므로
 * `html`, `body` 를 직접 그린다. 이 자리에서 잡지 않으면 어디에도 기록이
 * 남지 않는 오류라서 Sentry 로 꼭 올린다.
 *
 * "다시 시도" 는 Next 의 `reset()` 이 아니라 전체 새로고침이다. 여기까지 온
 * 오류는 앱 라우터 자체가 처음 그려지다 깨진 경우가 많은데, Next 14 는 라우터의
 * 초기 캐시(`initialParallelRoutes`)를 첫 렌더에서 쓰고 곧바로 비운다. 그래서
 * `reset()` 으로 다시 그리면 비워진 값을 읽다
 * `null is not an object (evaluating 't.parallelRoutes.get')` 로 같은 자리에서
 * 또 터지고, 누를 때마다 같은 오류가 Sentry 에 쌓인다(DAISO-FINDER-R).
 * 새로고침만이 라우터를 처음 상태로 되돌린다.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
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
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-red"
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}

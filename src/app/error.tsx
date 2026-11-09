"use client";

import { css } from "@styled-system/css";
import * as Sentry from "@sentry/nextjs";
import { IconRefresh, IconAlertTriangle } from "@tabler/icons-react";
import { AppShell } from "@/components/AppShell";
import { SiteLogo } from "@/components/SiteLogo";
import {
  statusCardClass,
  statusIconClass,
  statusTitleClass,
} from "@/components/statusStyles";
import { trackEvent } from "@/lib/gtag";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("화면 오류:", error);
    // GA 는 "얼마나 터지는지", Sentry 는 "무엇이 터졌는지"를 본다. 서버에서
    // 난 오류는 digest 만 넘어오므로 서버 쪽 이벤트와 이어 볼 수 있게 태그로 단다.
    Sentry.captureException(error, {
      tags: { boundary: "error", error_digest: error.digest },
    });
    // 화면이 통째로 깨진 자리. 여정 어디에서 터졌는지는 기본 파라미터로 붙는다.
    trackEvent("app_error", {
      message: error.message.slice(0, 100),
      error_digest: error.digest,
      page_path: window.location.pathname,
    });
  }, [error]);

  return (
    <AppShell>
      <main
        className={css({
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        })}
      >
        <SiteLogo spaced />
        <section role="alert" className={statusCardClass}>
          <span className={statusIconClass}>
            <IconAlertTriangle aria-hidden="true" width={34} height={34} />
          </span>
          <div>
            <h1 className={statusTitleClass}>잠시 문제가 발생했습니다</h1>
            <p className="text-muted">
              페이지를 다시 불러오거나 매장을 다시 검색해주세요.
            </p>
          </div>
          <button type="button" onClick={reset} className="btn btn-red">
            <IconRefresh width={18} height={18} />
            다시 시도
          </button>
        </section>
      </main>
    </AppShell>
  );
}

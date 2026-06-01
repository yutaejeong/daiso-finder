"use client";

import { css } from "@styled-system/css";
import { IconRefresh, IconAlertTriangle } from "@tabler/icons-react";
import Image from "next/image";
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
  }, [error]);

  return (
    <main
      className={css({
        width: "100%",
        maxWidth: "480px",
        minHeight: "100%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      })}
    >
      <Link href="/" aria-label="다이소 파인더 홈으로 이동">
        <Image
          src="/logo.svg"
          alt="다이소 파인더 로고"
          width={200}
          height={80}
          priority
          draggable={false}
          style={{ WebkitUserDrag: "none" } as React.CSSProperties}
          className={css({
            userSelect: "none",
            marginBottom: "24px",
            width: "150px",
            height: "60px",
            lg: { width: "200px", height: "80px" },
          })}
        />
      </Link>
      <section
        role="alert"
        className={css({
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          textAlign: "center",
          padding: "32px 16px",
          border: "1px solid #e5e5e5",
          borderRadius: "8px",
          backgroundColor: "#fff",
        })}
      >
        <IconAlertTriangle
          aria-hidden="true"
          width={46}
          height={46}
          className={css({ color: "#ED1C24" })}
        />
        <div>
          <h1
            className={css({
              marginBottom: "8px",
              fontSize: "1.5rem",
              lineHeight: 1.35,
              wordBreak: "keep-all",
            })}
          >
            잠시 문제가 발생했습니다
          </h1>
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
  );
}

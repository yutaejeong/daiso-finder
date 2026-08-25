import { css } from "@styled-system/css";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_NAME } from "@/lib/site";

/**
 * 소개·문의·개인정보·개발자 포털처럼 본문이 긴 정적 페이지의 공통 껍데기.
 * body 가 100dvh 로 고정돼 있으므로 스크롤은 이 컨테이너 안에서 일어난다.
 */
export function ContentPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <div
      className={css({
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
      })}
    >
      <main
        className={css({
          width: "100%",
          maxWidth: "720px",
          margin: "0 auto",
          paddingBottom: "32px",
        })}
      >
        <Link
          href="/"
          aria-label={`${SITE_NAME} 홈으로 이동`}
          className={css({ display: "inline-block", marginBottom: "20px" })}
        >
          <Image
            src="/logo.svg"
            alt={SITE_NAME}
            width={150}
            height={60}
            priority
            className={css({ width: "130px", height: "52px" })}
          />
        </Link>
        <h1>{title}</h1>
        <p
          className={css({
            fontSize: "0.9375rem",
            lineHeight: 1.7,
            color: "#374151",
          })}
        >
          {lead}
        </p>
        {children}
        <SiteFooter />
      </main>
    </div>
  );
}

export const sectionClass = css({
  marginTop: "28px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
});

export const headingClass = css({
  margin: 0,
  fontSize: "1.0625rem",
  fontWeight: 700,
  color: "#1f2937",
});

export const paragraphClass = css({
  margin: 0,
  fontSize: "0.9375rem",
  lineHeight: 1.75,
  color: "#374151",
});

export const listClass = css({
  margin: 0,
  paddingLeft: "20px",
  listStyle: "disc outside",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "0.9375rem",
  lineHeight: 1.7,
  color: "#374151",
});

export const codeBlockClass = css({
  margin: 0,
  padding: "12px 14px",
  borderRadius: "6px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#f8f8f8",
  color: "#1f2937",
  fontSize: "0.8125rem",
  lineHeight: 1.6,
  overflowX: "auto",
  whiteSpace: "pre",
});

export const inlineLinkClass = css({
  color: "#c4002f",
  textDecoration: "underline",
});

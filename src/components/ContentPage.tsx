import { css } from "@styled-system/css";
import { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * 소개·문의·개인정보·개발자 포털처럼 본문이 긴 정적 페이지의 공통 껍데기.
 * 앱 화면과 달리 문서 자체가 스크롤된다(globals.css 의 `.page`).
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
    <div className="page">
      <SiteHeader />
      <main className="page__body">
        <h1
          className={css({
            marginBottom: "12px",
            fontSize: "1.875rem",
            lineHeight: 1.25,
            wordBreak: "keep-all",
          })}
        >
          {title}
        </h1>
        <p
          className={css({
            margin: 0,
            fontSize: "1.0625rem",
            lineHeight: 1.7,
            color: "var(--ink-2)",
            wordBreak: "keep-all",
          })}
        >
          {lead}
        </p>
        {children}
      </main>
      <div className="page__body" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <SiteFooter />
      </div>
    </div>
  );
}

export const sectionClass = css({
  marginTop: "36px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
});

export const headingClass = css({
  margin: 0,
  fontSize: "1.25rem",
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: "var(--ink)",
});

export const paragraphClass = css({
  margin: 0,
  fontSize: "0.9375rem",
  lineHeight: 1.8,
  color: "var(--ink-2)",
  wordBreak: "keep-all",
  "& a": {
    color: "var(--brand)",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },
});

export const listClass = css({
  margin: 0,
  paddingLeft: "20px",
  listStyle: "disc outside",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  fontSize: "0.9375rem",
  lineHeight: 1.7,
  color: "var(--ink-2)",
  wordBreak: "keep-all",
  "& li::marker": { color: "var(--muted)" },
  "& a": {
    color: "var(--brand)",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },
});

export const codeBlockClass = css({
  margin: 0,
  padding: "14px 16px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--line)",
  backgroundColor: "var(--surface)",
  color: "var(--ink)",
  fontSize: "0.8125rem",
  lineHeight: 1.65,
  overflowX: "auto",
  whiteSpace: "pre",
  boxShadow: "var(--shadow-1)",
});

export const inlineLinkClass = css({
  color: "var(--brand)",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
});

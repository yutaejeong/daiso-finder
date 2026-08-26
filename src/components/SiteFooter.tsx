import { css } from "@styled-system/css";
import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME, SOURCE_REPOSITORY } from "@/lib/site";

const linkGroups = [
  {
    title: "서비스",
    links: [
      { href: "/", label: "매장·상품 검색" },
      { href: "/about", label: `${SITE_NAME} 소개` },
      { href: "/contact", label: "문의하기" },
      { href: "/privacy", label: "개인정보 처리방침" },
    ],
  },
  {
    title: "개발자·에이전트",
    links: [
      { href: "/developers", label: "개발자 포털" },
      { href: "/openapi.json", label: "OpenAPI 스펙 (JSON)" },
      { href: "/openapi.yaml", label: "OpenAPI 스펙 (YAML)" },
      { href: "/api", label: "API 엔드포인트 목록" },
      { href: "/api/sandbox", label: "샌드박스 API" },
      { href: "/llms.txt", label: "llms.txt" },
      { href: "/agent-instructions.md", label: "에이전트 사용 안내" },
    ],
  },
];

const footerLinkClass = css({
  color: "#4b5563",
  fontSize: "0.8125rem",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});

/** 모든 정적 페이지와 홈 하단에 공통으로 붙는 사이트 내비게이션. */
export function SiteFooter() {
  return (
    <footer
      className={css({
        marginTop: "32px",
        paddingTop: "20px",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      })}
    >
      <nav
        aria-label="사이트 및 개발자 리소스"
        className={css({
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "1fr",
          sm: { gridTemplateColumns: "1fr 1fr" },
        })}
      >
        {linkGroups.map((group) => (
          <div key={group.title}>
            <h2
              className={css({
                margin: "0 0 8px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "#1f2937",
              })}
            >
              {group.title}
            </h2>
            <ul
              className={css({
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              })}
            >
              {group.links.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("/openapi") ||
                  link.href.endsWith(".txt") ||
                  link.href.endsWith(".md") ||
                  link.href.startsWith("/api") ? (
                    <a className={footerLinkClass} href={link.href}>
                      {link.label}
                    </a>
                  ) : (
                    <Link className={footerLinkClass} href={link.href}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <p
        className={css({
          margin: 0,
          fontSize: "0.75rem",
          color: "#6b7280",
          lineHeight: 1.6,
        })}
      >
        {SITE_NAME}는 다이소가 운영하는 공식 서비스가 아닌 개인 제작 오픈소스
        프로젝트입니다. 문의는{" "}
        <a className={footerLinkClass} href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        , 소스 코드는{" "}
        <a
          className={footerLinkClass}
          href={SOURCE_REPOSITORY}
          rel="noopener noreferrer"
          target="_blank"
        >
          GitHub 저장소
        </a>
        에서 확인할 수 있습니다.
      </p>
    </footer>
  );
}

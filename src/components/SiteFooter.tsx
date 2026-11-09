import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const footerLinks = [
  { href: "/about", label: "서비스 소개" },
  { href: "/contact", label: "문의" },
  { href: "/privacy", label: "개인정보 처리방침" },
  { href: "/developers", label: "개발자" },
];

/**
 * 모든 화면 하단에 붙는 최소한의 사이트 정보.
 * API 스펙·llms.txt 같은 기계용 링크는 개발자 포털(/developers)로 모았다.
 *
 * - `compact`: 앱 화면(홈) 하단. 링크 한 줄만 둬서 결과 목록의 높이를 아낀다.
 * - 기본: 정적 페이지 하단. 비공식 서비스라는 고지를 한 줄 덧붙인다.
 */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      className={compact ? "site-footer site-footer--compact" : "site-footer"}
    >
      <nav aria-label="사이트 정보">
        <ul className="site-footer__links">
          {footerLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      {!compact && (
        <p className="site-footer__note">
          {SITE_NAME}는 다이소의 공식 서비스가 아닌 개인 오픈소스
          프로젝트입니다.
        </p>
      )}
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteLogo } from "@/components/SiteLogo";

const navLinks = [
  { href: "/about", label: "소개" },
  { href: "/developers", label: "개발자" },
  { href: "/contact", label: "문의" },
];

/**
 * 정적 페이지 상단의 고정 헤더. 스크롤하면 내용이 흐리게 비쳐 보이는 반투명
 * 바탕이라 Safari 의 상태바 영역(안전 영역) 뒤까지 같은 색으로 이어진다.
 */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <SiteLogo />
        <nav className="site-header__nav" aria-label="주요 메뉴">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="site-header__link"
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

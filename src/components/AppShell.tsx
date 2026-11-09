import { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * 홈·매장·상품 화면의 공통 껍데기. 화면 높이(100dvh)에 고정하고 안전 영역만큼
 * 안쪽으로 들여서, 결과 목록만 안에서 스크롤되는 앱 같은 화면을 만든다.
 * 스타일은 globals.css 의 `.app-shell` 에 있다.
 */
export function AppShell({
  children,
  footer = false,
}: {
  children: ReactNode;
  /** 하단에 사이트 링크 한 줄을 붙일지. 홈에서만 켠다. */
  footer?: boolean;
}) {
  return (
    <div className="app-shell">
      <div className="app-shell__inner">
        {children}
        {footer && <SiteFooter compact />}
      </div>
    </div>
  );
}

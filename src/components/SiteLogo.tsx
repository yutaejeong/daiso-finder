import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

/**
 * 모든 화면 상단의 로고. 크기(높이 32px)와 홈 링크를 한 곳에서 정해 페이지마다
 * 크기·여백이 어긋나지 않게 한다. 스타일은 globals.css 의 `.site-logo`.
 *
 * - `spaced`: 앱 화면에서 로고 아래에 표준 간격(16px)을 둔다.
 *   정적 페이지의 SiteHeader 는 헤더 높이로 정렬하므로 쓰지 않는다.
 *
 * `logo.svg` 는 Next 가 최적화 없이 그대로 서빙하므로 ImageWithFallback 이 필요 없다.
 */
export function SiteLogo({ spaced = false }: { spaced?: boolean }) {
  return (
    <Link
      href="/"
      aria-label={`${SITE_NAME} 홈으로 이동`}
      className={spaced ? "site-logo site-logo--spaced" : "site-logo"}
    >
      <Image
        src="/logo.svg"
        alt={SITE_NAME}
        width={150}
        height={59}
        priority
        draggable={false}
      />
    </Link>
  );
}

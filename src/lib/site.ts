/**
 * 사이트 전역 상수. 도메인/브랜드/연락처가 여러 라우트에서 반복되므로
 * 한 곳에서만 정의하고 llms.txt·JSON-LD·OpenAPI가 모두 이 값을 쓴다.
 */
export const SITE_NAME = "다이소 파인더";
export const SITE_NAME_EN = "Daiso Finder";
export const SITE_TAGLINE =
  "다이소 매장의 상품 재고, 가격, 진열 위치를 확인하세요.";
export const SITE_TAGLINE_EN =
  "Find Daiso stores in Korea and check in-store product stock, price, and shelf location.";

/**
 * 배포된 canonical 호스트. apex(daiso-finder.kr)는 www 로 307 리다이렉트되므로
 * sitemap·canonical 태그·오류 documentation 이 리다이렉트되지 않는 주소를 가리키도록
 * www 를 기준으로 삼는다.
 */
export const DEFAULT_APP_URL = "https://www.daiso-finder.kr";

/** 문의용 공개 메일 주소. 실제 수신함 연결은 배포 담당자가 설정한다. */
export const CONTACT_EMAIL = "contact@daiso-finder.kr";
export const SOURCE_REPOSITORY = "https://github.com/yutaejeong/daiso-finder";
export const CLI_PACKAGE_NAME = "daiso-finder-cli";

/** 서비스 운영 지역. 정확한 주소가 공개되어 있지 않아 국가/지역까지만 표기한다. */
export const ORGANIZATION_ADDRESS = {
  addressCountry: "KR",
  addressRegion: "서울특별시",
} as const;

export function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL).replace(
    /\/$/,
    "",
  );
}

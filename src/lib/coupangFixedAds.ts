import {
  COUPANG_AD_LIMIT,
  type CoupangAd,
  parseCoupangSearchResponse,
} from "@/lib/coupangPartners";

/**
 * 쿠팡 파트너스 최종 승인 전 임시 광고. Open API 키는 최종 승인 뒤에 나오므로, 그
 * 전에는 파트너스 대시보드의 "링크 생성"으로 만든 고정 링크를 보여준다(승인 심사에
 * 낼 "게시된 파트너스 링크" 화면이 이것이다). API 키가 설정되면 자동으로 검색어 기반
 * 광고로 바뀌고 이 목록은 쓰이지 않는다 — 그때 지운다.
 *
 * 상품명·가격은 링크 생성 화면에 보이는 값을 그대로 옮긴다. 이 링크를 서버나 스크립트
 * 에서 직접 열어 값을 채우지 말 것: 쿠팡에 클릭으로 잡혀 무효 트래픽이 된다.
 * 상품명이나 가격이 비어 있는 항목은 화면에 나가지 않는다.
 */
interface FixedAdLink {
  url: string;
  name: string;
  /** 원 단위 판매가 */
  price: number;
  /** 링크 생성 화면의 상품 이미지 주소(coupangcdn.com 등). 없으면 빈 칸 아이콘 */
  image?: string;
  isRocket?: boolean;
  isFreeShipping?: boolean;
}

export const COUPANG_FIXED_AD_LINKS: FixedAdLink[] = [
  { url: "https://link.coupang.com/a/i2qc1TH33Q", name: "", price: 0 },
  { url: "https://link.coupang.com/a/i2qd9aoZ3Y", name: "", price: 0 },
  { url: "https://link.coupang.com/a/i2qgpvlebA", name: "", price: 0 },
];

/** 짧은 링크의 마지막 경로 조각을 광고 ID 로 쓴다(클릭 기록의 상품 번호 열). */
function linkId(url: string) {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    return "";
  }
}

/**
 * 화면에 내보낼 고정 광고. 검색 API 응답과 같은 검증(쿠팡 https 링크·이미지만,
 * 이름·가격 필수, 최대 {@link COUPANG_AD_LIMIT}개)을 거친다.
 */
export function getFixedCoupangAds(
  links: FixedAdLink[] = COUPANG_FIXED_AD_LINKS,
): CoupangAd[] {
  return parseCoupangSearchResponse({
    rCode: "0",
    data: {
      productData: links.map((link) => ({
        productId: linkId(link.url),
        productName: link.name,
        productPrice: link.price,
        productImage: link.image,
        productUrl: link.url,
        isRocket: link.isRocket === true,
        isFreeShipping: link.isFreeShipping === true,
      })),
    },
  });
}

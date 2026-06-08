import {
  createDaisoOgImage,
  ogImageContentType,
  ogImageSize,
} from "@/lib/ogImage";

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = "다이소 파인더 - 다이소 상품 찾기";
export const runtime = "nodejs";

export default function Image() {
  return createDaisoOgImage({
    eyebrow: "다이소 파인더",
    title: "다이소 상품 찾기",
    subtitle: "매장별 재고, 가격, 진열 위치를 빠르게 확인하세요.",
    badge: "상품 검색",
  });
}

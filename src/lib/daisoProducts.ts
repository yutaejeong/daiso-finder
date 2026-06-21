import { SimplifiedProductInfo } from "@/app/api/products/types";
import { pdThumbSel } from "@/generated/daiso/client";

/**
 * pdThumbSel(상품 썸네일 정보 조회) 응답에서 사용하는 필드.
 * 응답 래퍼가 명세상 untyped object 이므로 방어적으로 파싱한다.
 */
interface PdInfoSelVO {
  pdNo?: string;
  pdNm?: string;
  pdPrc?: string;
  atchFileUrl?: string | null;
  pdImgUrl?: string | null;
  brndNm?: string | null;
}

const HTML_ENTITY_PATTERN = /&(amp|lt|gt|quot|apos|#39|nbsp);/g;

function decodeHtmlEntities(text: string): string {
  return text.replace(HTML_ENTITY_PATTERN, (match, entity) => {
    switch (entity) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return '"';
      case "apos":
      case "#39":
        return "'";
      case "nbsp":
        return " ";
      default:
        return match;
    }
  });
}

function resolveImageUrl(vo: PdInfoSelVO): string | null {
  const raw = vo.atchFileUrl || vo.pdImgUrl;
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  return `https://cdn.daisomall.co.kr${raw}`;
}

/**
 * 상품번호(pdNo)로 상품 기본 정보(이름/가격/이미지)를 조회한다.
 * 매장 상품 상세 페이지의 헤더를 product id 만으로 렌더링하기 위해 사용한다.
 */
export async function fetchProductById(
  pdNo: string,
): Promise<SimplifiedProductInfo | null> {
  let json: unknown;

  try {
    json = await pdThumbSel({ pdNo });
  } catch {
    return null;
  }

  // 래퍼 형태가 명확치 않아 data 배열/단일 객체/루트 객체를 모두 허용
  const wrappedJson = json as { data?: PdInfoSelVO[] | PdInfoSelVO };
  const candidate: PdInfoSelVO | undefined = Array.isArray(wrappedJson?.data)
    ? wrappedJson.data[0]
    : (wrappedJson?.data ?? (json as PdInfoSelVO));

  if (!candidate || !candidate.pdNm) {
    return null;
  }

  const price = parseInt(candidate.pdPrc ?? "");

  return {
    id: candidate.pdNo ?? pdNo,
    name: decodeHtmlEntities(candidate.pdNm),
    price: Number.isNaN(price) ? 0 : price,
    image: resolveImageUrl(candidate),
    brand: candidate.brndNm ?? null,
  };
}

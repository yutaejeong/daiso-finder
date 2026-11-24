/**
 * 매장·상품 상세 조회와 쿠팡 파트너스 광고의 노출·클릭을 서버(`POST /api/views`)에
 * 알린다. 서버는 이를 스프레드시트와 Vercel 런타임 로그에 쌓는다(`src/lib/searchLog.ts`).
 *
 * 같은 탭 세션 안에서 같은 화면은 한 번만 보낸다. 뒤로 가기로 다시 들어오거나
 * 새로고침해도 한 사람이 한 번 본 것으로 세야 인기 순위가 반복 방문에 휘둘리지
 * 않는다.
 */

const VIEWS_ENDPOINT = "/api/views";
const SENT_KEY_PREFIX = "daiso-finder:view:";

export type ViewBeacon =
  | { type: "branch_view"; branchCode: string }
  | {
      type: "product_view";
      branchCode: string;
      productId: string;
      productName?: string | null;
    }
  | {
      type: "ad_impression";
      branchCode: string;
      keyword: string;
      adCount: number;
    }
  | {
      type: "ad_click";
      branchCode: string;
      keyword: string;
      /** 쿠팡 상품 ID */
      productId: string;
      productName: string;
    };

function viewKey(view: ViewBeacon) {
  switch (view.type) {
    case "product_view":
      return `${SENT_KEY_PREFIX}${view.type}:${view.branchCode}:${view.productId}`;
    case "ad_impression":
      return `${SENT_KEY_PREFIX}${view.type}:${view.branchCode}:${view.keyword}`;
    case "ad_click":
      return `${SENT_KEY_PREFIX}${view.type}:${view.branchCode}:${view.keyword}:${view.productId}`;
    default:
      return `${SENT_KEY_PREFIX}${view.type}:${view.branchCode}`;
  }
}

/** 이번 세션에 처음 보는 화면이면 표시해 두고 true. 저장소가 막혀 있으면 매번 보낸다. */
function markFirstView(key: string) {
  try {
    if (sessionStorage.getItem(key)) {
      return false;
    }
    sessionStorage.setItem(key, "1");
  } catch {
    // 시크릿 창 등에서 sessionStorage 를 못 쓰면 중복 제거 없이 보낸다.
  }
  return true;
}

export function sendViewBeacon(view: ViewBeacon) {
  if (typeof window === "undefined" || !markFirstView(viewKey(view))) {
    return;
  }

  // 문자열 본문은 text/plain 으로 나가 프리플라이트 없이 전송된다.
  const body = JSON.stringify(view);

  try {
    if (navigator.sendBeacon?.(VIEWS_ENDPOINT, body)) {
      return;
    }
  } catch {
    // sendBeacon 이 없거나 거부되면 아래 fetch 로 보낸다.
  }

  fetch(VIEWS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
    keepalive: true,
  }).catch(() => {
    // 조회 기록은 부가 기능이라 실패해도 화면에는 영향을 주지 않는다.
  });
}

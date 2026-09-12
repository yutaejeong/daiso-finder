declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

let bootstrapped = false;

/**
 * gtag 큐를 만들고 `js` / `config` 를 먼저 밀어 넣는다.
 *
 * gtag.js 스크립트는 afterInteractive 로 늦게 붙기 때문에, 그 전에 발생한
 * 이벤트도 같은 dataLayer 큐에 쌓여야 유실되지 않는다. 다만 gtag.js 는 큐를
 * 순서대로 처리하면서 `config` 보다 먼저 들어온 이벤트는 버리므로, 이벤트를
 * 보내는 모든 경로가 이 함수를 거쳐 `config` 가 항상 앞에 오도록 한다.
 *
 * 첫 페이지뷰는 유입 정보를 실어 직접 보내야 해서(`trackPageView`)
 * `send_page_view` 를 끈다.
 */
function ensureGtag() {
  if (typeof window === "undefined" || !GA_ID) return null;

  if (typeof window.gtag !== "function") {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // gtag.js 스니펫과 동일하게 arguments 객체를 그대로 큐에 넣는다.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }

  if (!bootstrapped) {
    bootstrapped = true;
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { send_page_view: false });
  }

  return window.gtag;
}

// 모든 이벤트에 함께 보낼 파라미터. gtag 가 아니라 여기서 직접 들고 있는다.
let eventDefaults: Record<string, unknown> = {};

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  ensureGtag()?.("event", eventName, { ...eventDefaults, ...params });
}

/**
 * 이후 보내는 모든 이벤트에 함께 실을 기본 파라미터를 설정한다.
 * 유입 경로와 현재 여정 단계를 여기에 넣어두면 어떤 이벤트를 보든
 * 그 방문자가 어디서 와서 지금 어느 단계에 있는지 함께 보인다.
 *
 * `gtag('set', …)` 로는 안 된다. GA4 태그는 set 으로 넘긴 커스텀
 * 파라미터를 후속 이벤트에 붙여주지 않아서(예약된 몇 개만 반영된다)
 * 실제 전송 payload 에서 통째로 빠진다. 그래서 직접 병합해 보낸다.
 *
 * 이벤트당 파라미터는 25개가 GA4 한도라 기본 파라미터는 꼭 필요한 것만
 * 둔다. 나머지 유입 정보는 `app_entry` 이벤트가 한 번 싣고 간다.
 */
export function setEventDefaults(params: Record<string, unknown>) {
  eventDefaults = { ...params };
}

/**
 * Next 가 서버를 띄울 때 런타임마다 한 번 부르는 훅. 런타임별 Sentry 설정
 * 파일을 여기서 불러온다. Next 14 에서는 `experimental.instrumentationHook`
 * 이 켜져 있어야 동작한다(`next.config.js` 참고).
 */

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

/**
 * 서버 렌더 중 터진 오류를 Sentry 로 보내는 Next 훅. Next 15 부터 호출되며
 * 14 에서는 쓰이지 않는다. 업그레이드할 때 따로 챙기지 않아도 되도록 둔다.
 */
export const onRequestError = Sentry.captureRequestError;

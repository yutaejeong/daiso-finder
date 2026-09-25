/**
 * 상류 오류 클래스들의 `name`. 클래스 자체를 import 하면 라우트 번들에 다이소
 * 클라이언트가 딸려오고 순환 참조도 생기므로 이름으로 판별한다.
 * `tests/apiError.test.mjs` 가 실제 클래스와 이 목록이 어긋나지 않는지 지킨다.
 *
 * `apiError.ts`(응답 분기)와 `sentry.ts`(리포트 걸러내기)가 함께 쓴다. `sentry.ts`
 * 는 SDK 를 import 하지 않는 순수 모듈이라, SDK 를 끌어오는 `apiError.ts` 대신
 * 이 파일에 둔다.
 */
export const UPSTREAM_ERROR_NAMES = [
  "DaisoApiError",
  "DaisoBranchApiError",
] as const;

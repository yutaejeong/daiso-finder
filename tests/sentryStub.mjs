/**
 * node:test 러너에서 쓰는 `@sentry/nextjs` 대역.
 *
 * 실제 패키지는 Node 조건에서 CJS 번들로 풀리는데, Node 의 ESM 인터롭은 그
 * 번들에서 `captureException` 같은 이름을 찾아내지 못한다(웹팩은 찾아낸다).
 * 테스트에서 진짜 SDK 를 띄울 이유도 없으므로 `tests/alias-hook.mjs` 가
 * 이 파일로 바꿔치기하고, 여기서 호출 기록만 모아 검증에 쓴다.
 */

/** 지금까지 올라간 예외. 테스트가 직접 비우고 확인한다. */
export const capturedExceptions = [];

export function captureException(error, context) {
  capturedExceptions.push({ error, context });
  return "test-event-id";
}

export function captureMessage() {}

export function init() {}

export function captureRequestError() {}

/**
 * 브라우저에서 실행되는 Sentry 초기화. 이 파일은 Sentry 웹팩 플러그인이
 * 클라이언트 번들 맨 앞에 끼워 넣는다(파일 이름을 바꾸면 안 된다).
 *
 * 공통 옵션은 `src/lib/sentry.ts` 가 만든다. DSN 이 없으면 꺼진 채로 둔다.
 */

import * as Sentry from "@sentry/nextjs";
import { baseSentryOptions } from "@/lib/sentry";

// 세션 리플레이는 기본으로 켜지 않는다. 번들이 커지고 화면에 검색어가 그대로
// 찍히므로, 필요해지면 docs/sentry.md 의 안내대로 integrations 에 추가한다.
Sentry.init({
  ...baseSentryOptions(),
});

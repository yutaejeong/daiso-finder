/**
 * Node 런타임(API 라우트, 서버 컴포넌트)에서 실행되는 Sentry 초기화.
 * `src/instrumentation.ts` 가 불러온다.
 */

import * as Sentry from "@sentry/nextjs";
import { baseSentryOptions } from "@/lib/sentry";

Sentry.init({
  ...baseSentryOptions(),
});

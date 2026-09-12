/**
 * 엣지 런타임(미들웨어)에서 실행되는 Sentry 초기화.
 * `src/instrumentation.ts` 가 불러온다.
 */

import * as Sentry from "@sentry/nextjs";
import { baseSentryOptions } from "@/lib/sentry";

Sentry.init({
  ...baseSentryOptions(),
});

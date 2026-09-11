"use client";

import Script from "next/script";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";

function JourneyTracker() {
  useJourneyTracking();
  return null;
}

/**
 * gtag.js 라이브러리만 불러온다. dataLayer 초기화와 `config` 는
 * `src/lib/gtag.ts` 가 이벤트보다 항상 먼저 큐에 넣어주므로
 * 별도의 인라인 스니펫을 두지 않는다(페이지뷰 중복 방지).
 */
export function GoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <JourneyTracker />
    </>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { trackEvent } from "@/lib/gtag";
import {
  ensureJourney,
  trackPageEngagement,
  trackPageExit,
  trackPageView,
} from "@/lib/journey";

const SCROLL_MILESTONES = [25, 50, 75, 90] as const;
/** 링크를 누른 직후 화면이 가려지면 그 클릭이 이탈 경로였다고 본다. */
const CLICK_INTENT_WINDOW_MS = 2000;
/** hidden 직후 pagehide 가 이어질 때 같은 이탈을 두 번 보내지 않도록 둔다. */
const EXIT_DEDUPE_MS = 600;

/**
 * 페이지 단위 여정 계측을 브라우저 이벤트에 연결한다.
 *
 * - 페이지뷰: 최초 진입과 SPA 이동을 모두 `page_view` 로 직접 보낸다.
 * - 체류: 화면이 보이는 동안만 시간을 더해 `page_engagement` 로 남긴다.
 * - 스크롤: 본문이든 결과 목록이든 실제로 스크롤된 영역의 깊이를 잰다.
 * - 이탈: 화면이 가려지거나 문서가 닫히는 순간을 `page_exit` 로 남긴다.
 */
export function useJourneyTracking() {
  const pathname = usePathname();
  const pathRef = useRef<string | null>(null);
  const engagedMsRef = useRef(0);
  const visibleSinceRef = useRef<number | null>(null);
  const maxScrollRef = useRef(0);
  const milestonesRef = useRef<Set<number>>(new Set());
  const hiddenCountRef = useRef(0);
  const intentRef = useRef<{ type: string; at: number } | null>(null);
  const lastExitAtRef = useRef(0);

  /** 지금까지 화면에 떠 있던 시간을 초 단위로 확정한다. */
  const flushEngagedSeconds = useCallback(() => {
    if (visibleSinceRef.current !== null) {
      engagedMsRef.current += Date.now() - visibleSinceRef.current;
      visibleSinceRef.current =
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
          ? Date.now()
          : null;
    }
    return Math.round(engagedMsRef.current / 1000);
  }, []);

  // 페이지가 바뀔 때마다 계측 상태를 초기화하고 page_view 를 보낸다.
  useEffect(() => {
    const previous = pathRef.current;
    if (previous === pathname) return;

    if (previous !== null) {
      // 사이트 안에서의 이동은 이탈이 아니므로 체류 기록만 남긴다.
      trackPageEngagement({
        path: previous,
        toPath: pathname,
        engagedSeconds: flushEngagedSeconds(),
        maxScrollPercent: maxScrollRef.current,
      });
    }

    pathRef.current = pathname;
    engagedMsRef.current = 0;
    visibleSinceRef.current =
      document.visibilityState === "visible" ? Date.now() : null;
    maxScrollRef.current = 0;
    milestonesRef.current = new Set();
    hiddenCountRef.current = 0;

    ensureJourney();
    trackPageView({ fromPath: previous });
  }, [pathname, flushEngagedSeconds]);

  // 이탈·스크롤·외부 링크는 페이지가 바뀌어도 같은 리스너로 계속 본다.
  useEffect(() => {
    const currentPath = () => pathRef.current ?? window.location.pathname;

    const sendExit = (reason: string) => {
      const now = Date.now();
      if (now - lastExitAtRef.current < EXIT_DEDUPE_MS) return;
      lastExitAtRef.current = now;

      const intent = intentRef.current;
      trackPageExit({
        path: currentPath(),
        engagedSeconds: flushEngagedSeconds(),
        maxScrollPercent: maxScrollRef.current,
        reason,
        intent:
          intent && now - intent.at < CLICK_INTENT_WINDOW_MS
            ? intent.type
            : "unknown",
        hiddenCount: hiddenCountRef.current,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenCountRef.current += 1;
        sendExit("hidden");
        visibleSinceRef.current = null;
      } else {
        visibleSinceRef.current = Date.now();
      }
    };

    const handlePageHide = () => sendExit("pagehide");

    let scrollScheduled = false;
    const measureScroll = (element: HTMLElement) => {
      const scrollable = element.scrollHeight - element.clientHeight;
      // 스크롤이랄 게 없는 작은 영역은 깊이를 재지 않는다.
      if (scrollable < 80) return;

      const percent = Math.min(
        100,
        Math.round(
          ((element.scrollTop + element.clientHeight) / element.scrollHeight) *
            100,
        ),
      );
      if (percent <= maxScrollRef.current) return;
      maxScrollRef.current = percent;

      for (const milestone of SCROLL_MILESTONES) {
        if (percent < milestone || milestonesRef.current.has(milestone)) {
          continue;
        }
        milestonesRef.current.add(milestone);
        trackEvent("scroll_depth", {
          percent_scrolled: milestone,
          page_path: currentPath(),
        });
      }
    };

    // 결과 목록은 body 가 아니라 자체 스크롤 영역에서 움직인다. scroll 은
    // 버블링하지 않으므로 캡처 단계에서 받아 실제 스크롤된 요소를 잰다.
    const handleScroll = (event: Event) => {
      const target = event.target;
      const element =
        target instanceof HTMLElement ? target : document.documentElement;
      if (scrollScheduled) return;
      scrollScheduled = true;
      window.requestAnimationFrame(() => {
        scrollScheduled = false;
        measureScroll(element);
      });
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      const anchor =
        target instanceof Element ? target.closest("a[href]") : null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin === window.location.origin) {
        intentRef.current = { type: "internal", at: Date.now() };
        return;
      }

      intentRef.current = { type: "outbound", at: Date.now() };
      trackEvent("outbound_click", {
        link_url: url.href.slice(0, 100),
        link_domain: url.protocol.startsWith("http")
          ? url.hostname
          : url.protocol.replace(":", ""),
        link_text: (anchor.textContent ?? "").trim().slice(0, 100),
        page_path: currentPath(),
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("click", handleClick, true);
    };
  }, [flushEngagedSeconds]);
}

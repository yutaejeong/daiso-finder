"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/gtag";

interface Props {
  name: string;
  params?: Record<string, unknown>;
}

/**
 * 서버 컴포넌트에서도 이벤트를 한 번 남길 수 있게 해주는 빈 컴포넌트.
 * 404 처럼 렌더링 자체가 곧 신호인 화면에 붙인다.
 */
export function JourneyEvent({ name, params }: Props) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    trackEvent(name, { page_path: window.location.pathname, ...params });
  }, [name, params]);

  return null;
}

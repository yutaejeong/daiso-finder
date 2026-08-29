"use client";

import { useCallback, useEffect, useRef } from "react";

const STORAGE_PREFIX = "daiso-finder:scroll:";

function read(key: string): number | null {
  try {
    const saved = window.sessionStorage.getItem(STORAGE_PREFIX + key);
    if (saved === null) return null;
    const value = Number.parseFloat(saved);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function write(key: string, value: number) {
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + key, String(value));
  } catch {
    // 사파리 시크릿 모드처럼 sessionStorage 를 못 쓰는 환경은 그냥 넘어간다.
  }
}

/**
 * 스크롤 컨테이너의 위치를 검색 조건별로 기억했다가 되돌린다.
 *
 * 결과 목록은 `body` 가 아니라 자체 스크롤 영역 안에서 스크롤되므로 브라우저의
 * 스크롤 복원이 닿지 않는다. 상세 페이지를 보고 뒤로 돌아왔을 때 보고 있던
 * 위치가 유지되도록 세션 스토리지에 저장해 두고 다시 적용한다.
 *
 * @param key 검색 조건을 나타내는 키. 조건이 없으면 `null`.
 */
export function useScrollRestoration<T extends HTMLElement>(
  key: string | null,
) {
  const elementRef = useRef<T | null>(null);
  const appliedKeyRef = useRef<string | null>(null);

  const ref = useCallback((element: T | null) => {
    elementRef.current = element;
  }, []);

  // 스크롤 위치 저장. 조건이 바뀌면 새 키로 다시 붙인다.
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !key) return;

    const handleScroll = () => write(key, element.scrollTop);
    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [key]);

  // 결과가 그려진 뒤에야 원래 위치까지 스크롤할 수 있으므로,
  // 복원에 성공할 때까지 렌더링마다 다시 시도한다.
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !key || appliedKeyRef.current === key) return;

    const saved = read(key);
    if (saved === null || saved <= 0) {
      // 새 검색이면 이전 결과를 보던 위치가 남아 있지 않도록 맨 위로 올린다.
      element.scrollTop = 0;
      appliedKeyRef.current = key;
      return;
    }

    if (element.scrollHeight - element.clientHeight < saved) {
      // 아직 결과가 덜 그려졌다. 다음 렌더링에서 다시 시도한다.
      return;
    }

    element.scrollTop = saved;
    appliedKeyRef.current = key;
  });

  return ref;
}

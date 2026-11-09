"use client";

import clsx from "clsx";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface ScrollAreaProps {
  children: ReactNode;
  /** 스크롤되는 요소(viewport)에 붙일 클래스. 목록 간격 등 내용 배치용. */
  viewportClassName?: string;
  /** 스크롤 요소를 밖에서 알아야 할 때(스크롤 위치 복원 등)의 콜백 ref. */
  viewportRef?: (element: HTMLDivElement | null) => void;
}

/**
 * 세로 스크롤 영역. 위·아래로 더 스크롤할 내용이 있을 때만 해당 가장자리에
 * 안쪽 그림자를 보여 준다(스타일은 globals.css 의 `.scroll-area`).
 *
 * 그림자 유무는 스크롤 위치·영역 크기·내용 변화에 따라 다시 계산한다.
 */
export function ScrollArea({
  children,
  viewportClassName,
  viewportRef,
}: ScrollAreaProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  const setRefs = useCallback(
    (element: HTMLDivElement | null) => {
      elementRef.current = element;
      viewportRef?.(element);
    },
    [viewportRef],
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      // 소수점 스크롤(고해상도 화면)과 바운스 구간을 고려해 1px 여유를 둔다.
      const top = element.scrollTop > 1;
      const bottom =
        element.scrollTop + element.clientHeight < element.scrollHeight - 1;
      setEdges((prev) =>
        prev.top === top && prev.bottom === bottom ? prev : { top, bottom },
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    element.addEventListener("scroll", schedule, { passive: true });
    // 영역 크기 변화(창 크기·키보드)와 내용 추가·삭제(결과 로드) 모두 반영한다.
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(schedule);
    resizeObserver?.observe(element);
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    // 이미지가 늦게 로드되며 높이가 바뀌는 경우.
    element.addEventListener("load", schedule, true);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      element.removeEventListener("scroll", schedule);
      element.removeEventListener("load", schedule, true);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <div
      className="scroll-area"
      data-top={edges.top}
      data-bottom={edges.bottom}
    >
      <div
        ref={setRefs}
        className={clsx("scroll-area__viewport", viewportClassName)}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className="scroll-area__shadow scroll-area__shadow--top"
      />
      <div
        aria-hidden="true"
        className="scroll-area__shadow scroll-area__shadow--bottom"
      />
    </div>
  );
}

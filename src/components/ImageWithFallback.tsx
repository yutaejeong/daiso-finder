"use client";

import Image from "next/image";
import { CSSProperties, useCallback, useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  style?: CSSProperties;
  draggable?: boolean;
  priority?: boolean;
}

/**
 * next/image 로 렌더링하되, 최적화 요청(`/_next/image`)이 실패하면
 * 원본 URL을 가리키는 일반 `img` 태그로 폴백한다.
 *
 * Vercel의 Image Optimization 한도를 초과하면 `/_next/image` 가 오류를 반환해
 * 이미지가 통째로 깨지는데, 그때도 원본은 그대로 서빙되므로 화면은 유지된다.
 */
export function ImageWithFallback({
  src,
  alt,
  width,
  height,
  className,
  style,
  draggable,
  priority,
}: ImageWithFallbackProps) {
  const [optimizationFailed, setOptimizationFailed] = useState(false);

  const handleError = useCallback(() => setOptimizationFailed(true), []);

  // 하이드레이션 전에 로드가 끝나면 onError 를 놓치므로, 마운트 시점에도 확인한다.
  const detectBrokenImage = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth === 0) {
      setOptimizationFailed(true);
    }
  }, []);

  if (optimizationFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        draggable={draggable}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  return (
    <Image
      ref={detectBrokenImage}
      onError={handleError}
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      draggable={draggable}
      priority={priority}
    />
  );
}

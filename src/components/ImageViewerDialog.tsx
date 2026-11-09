"use client";

import { css } from "@styled-system/css";
import { IconArrowsMaximize, IconX } from "@tabler/icons-react";
import { useId, useRef, useState } from "react";
import { ImageWithFallback } from "@/components/ImageWithFallback";

interface Props {
  src: string;
  alt: string;
  /** 썸네일 크기(px). 모달에서는 화면에 맞춰 크게 보인다. */
  thumbnailWidth: number;
  thumbnailHeight: number;
  /** 열릴 때 호출. 분석 이벤트용. */
  onOpen?: () => void;
}

/**
 * 누르면 원본에 가까운 크기로 크게 보여 주는 이미지 썸네일.
 *
 * 네이티브 `<dialog>` 를 쓰므로 Esc 닫기, 포커스 가두기, 열기 전 요소로의 포커스
 * 복귀를 브라우저가 처리한다. 모달이 열리면 큰 이미지를 그때 처음 요청한다.
 */
export function ImageViewerDialog({
  src,
  alt,
  thumbnailWidth,
  thumbnailHeight,
  onOpen,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    setIsOpen(true);
    dialog.showModal();
    onOpen?.();
  };

  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={`${alt} 이미지 크게 보기`}
        className={css({
          position: "relative",
          flexShrink: 0,
          padding: 0,
          border: 0,
          borderRadius: "var(--radius-sm)",
          background: "none",
          cursor: "zoom-in",
          // 터치 기기에서 누를 때 살짝 눌리는 반응.
          transition: "transform 150ms ease",
          _active: { transform: "scale(0.97)" },
        })}
      >
        <ImageWithFallback
          src={src}
          alt=""
          width={thumbnailWidth}
          height={thumbnailHeight}
          className={css({
            display: "block",
            borderRadius: "var(--radius-sm)",
            objectFit: "cover",
            aspectRatio: "3 / 4",
            backgroundColor: "var(--surface-2)",
          })}
        />
        <span
          aria-hidden="true"
          className={css({
            position: "absolute",
            right: "6px",
            bottom: "6px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "26px",
            height: "26px",
            color: "var(--ink)",
            backgroundColor: "rgb(255 255 255 / 0.92)",
            borderRadius: "999px",
            boxShadow: "var(--shadow-1)",
          })}
        >
          <IconArrowsMaximize width={15} height={15} stroke={2.25} />
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setIsOpen(false)}
        // 이미지 바깥(어두운 배경)을 누르면 닫는다.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className={css({
          width: "100vw",
          height: "100dvh",
          maxWidth: "none",
          maxHeight: "none",
          margin: 0,
          padding: 0,
          border: 0,
          color: "#fff",
          backgroundColor: "transparent",
          overflow: "hidden",
          "&::backdrop": { backgroundColor: "rgb(10 12 18 / 0.88)" },
          // 닫혀 있을 때(display: none)에는 레이아웃을 건드리지 않게 열렸을 때만 배치한다.
          "&[open]": {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding:
              "max(64px, calc(env(safe-area-inset-top, 0px) + 56px)) max(16px, env(safe-area-inset-right, 0px)) max(16px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px))",
          },
        })}
      >
        <h2 id={titleId} className="sr-only">
          {alt}
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label="이미지 닫기"
          className={css({
            position: "absolute",
            top: "max(12px, env(safe-area-inset-top, 0px))",
            right: "max(12px, env(safe-area-inset-right, 0px))",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "44px",
            height: "44px",
            color: "#fff",
            backgroundColor: "rgb(255 255 255 / 0.16)",
            border: 0,
            borderRadius: "999px",
            cursor: "pointer",
            transition: "background-color 120ms ease",
            "@media (hover: hover)": {
              "&:hover": { backgroundColor: "rgb(255 255 255 / 0.28)" },
            },
          })}
        >
          <IconX aria-hidden="true" width={22} height={22} />
        </button>
        {isOpen && (
          <ImageWithFallback
            src={src}
            alt={alt}
            width={960}
            height={1280}
            className={css({
              width: "auto",
              height: "auto",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "var(--radius)",
              backgroundColor: "#fff",
              boxShadow: "0 20px 60px rgb(0 0 0 / 0.5)",
            })}
          />
        )}
      </dialog>
    </>
  );
}

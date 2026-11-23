"use client";

import { trackEvent } from "@/lib/gtag";
import { css } from "@styled-system/css";
import { IconCheck, IconShare3 } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

export function FloatingShareButton() {
  const [mounted, setMounted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback below
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.setAttribute("readonly", "");
      document.body.appendChild(textarea);
      textarea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      return successful;
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    const shareUrl = window.location.href;
    const shareTitle = document.title || "다이소 파인더";
    const metaDesc = (
      document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    )?.content;
    const shareText =
      metaDesc || "다이소 매장의 상품 재고, 가격, 진열 위치를 확인하세요.";

    trackEvent("share_button_click", {
      url: shareUrl,
      title: shareTitle,
    });

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        trackEvent("share_success", { method: "web_share" });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
      }
    }

    const copied = await copyToClipboard(shareUrl);
    if (copied) {
      showToast("링크가 클립보드에 복사되었습니다.");
      trackEvent("share_success", { method: "clipboard" });
    } else {
      showToast("링크 복사에 실패했습니다.");
    }
  };

  if (!mounted) return null;

  return (
    <>
      <aside
        aria-label="공유하기"
        className={css({
          position: "fixed",
          bottom: "calc(max(16px, env(safe-area-inset-bottom, 0px)) + 12px)",
          right: "max(16px, calc(50vw - 260px + 16px))",
          zIndex: 900,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          pointerEvents: "none",
        })}
      >
        <button
          type="button"
          onClick={handleShare}
          aria-label="페이지 공유하기"
          title="공유하기"
          className={css({
            pointerEvents: "auto",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            borderRadius: "9999px",
            backgroundColor: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow-2)",
            cursor: "pointer",
            transition:
              "transform 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease, background-color 160ms ease",
            _hover: {
              borderColor: "var(--brand)",
              color: "var(--brand)",
              boxShadow: "0 6px 18px rgb(196 0 47 / 0.18)",
              transform: "translateY(-2px)",
            },
            _active: {
              transform: "scale(0.92)",
            },
            _focusVisible: {
              outline: "2px solid var(--brand)",
              outlineOffset: "2px",
            },
          })}
        >
          <IconShare3 width={22} height={22} stroke={2} aria-hidden="true" />
        </button>
      </aside>

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={css({
            position: "fixed",
            bottom: "calc(max(16px, env(safe-area-inset-bottom, 0px)) + 70px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            backgroundColor: "rgba(21, 22, 26, 0.92)",
            color: "#ffffff",
            fontSize: "0.875rem",
            fontWeight: 600,
            lineHeight: 1.4,
            borderRadius: "9999px",
            boxShadow: "var(--shadow-2)",
            backdropFilter: "blur(8px)",
            animation: "toastIn 200ms ease-out",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          })}
        >
          <IconCheck
            width={18}
            height={18}
            stroke={2.5}
            color="#4ade80"
            aria-hidden="true"
          />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}

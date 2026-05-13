"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { trackEvent } from "@/lib/gtag";
import { css } from "@styled-system/css";
import { IconDownload } from "@tabler/icons-react";
import Image from "next/image";
import { useState } from "react";
import { PWAInstallInstructions } from "./PWAInstallInstructions";

export function PWAInstallBanner() {
  const { state, promptInstall, dismiss } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  if (state === "hidden") {
    return showIOSInstructions ? (
      <PWAInstallInstructions onClose={() => setShowIOSInstructions(false)} />
    ) : null;
  }

  const handleInstall = () => {
    trackEvent("pwa_install_banner_click", { platform: state });
    if (state === "android") {
      void promptInstall();
    } else {
      setShowIOSInstructions(true);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-label="앱 설치 안내"
        className={css({
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "12px 16px calc(12px + env(safe-area-inset-bottom, 0px))",
          zIndex: 1050,
          pointerEvents: "none",
        })}
      >
        <div
          className={`card ${css({
            pointerEvents: "auto",
            maxWidth: "480px",
            margin: "0 auto",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
            border: "1px solid #e5e5e5",
          })}`}
        >
          <div
            className={`card-body ${css({
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 14px !important",
            })}`}
          >
            <Image
              src="/logo.svg"
              alt="다이소 파인더"
              width={40}
              height={40}
              className={css({ flexShrink: 0 })}
            />
            <div className={css({ flex: 1, minWidth: 0 })}>
              <div
                className={css({
                  fontWeight: 600,
                  fontSize: "14px",
                  marginBottom: "2px",
                })}
              >
                앱으로 더 빠르게 찾기
              </div>
              <div
                className={css({
                  fontSize: "12px",
                  color: "#6c757d",
                  lineHeight: 1.4,
                })}
              >
                홈 화면에 추가하고 매장과 상품을 바로 검색하세요
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstall}
              className={`btn btn-red ${css({
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              })}`}
            >
              <IconDownload width={16} height={16} />
              설치
            </button>
            <button
              type="button"
              aria-label="닫기"
              onClick={dismiss}
              className={`btn-close ${css({ flexShrink: 0 })}`}
            />
          </div>
        </div>
      </div>
      {showIOSInstructions && (
        <PWAInstallInstructions onClose={() => setShowIOSInstructions(false)} />
      )}
    </>
  );
}

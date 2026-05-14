"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { trackEvent } from "@/lib/gtag";
import { css } from "@styled-system/css";
import {
  IconCirclePlus,
  IconDeviceMobile,
  IconDotsVertical,
  IconDownload,
  IconShare3,
} from "@tabler/icons-react";
import Image from "next/image";
import { useState } from "react";
import {
  PWAInstallInstructions,
  type PWAInstallStep,
} from "./PWAInstallInstructions";

type InstructionsKind = "ios" | "android";

const IOS_STEPS: PWAInstallStep[] = [
  { icon: IconShare3, text: "Safari 하단의 공유 버튼을 탭하세요" },
  {
    icon: IconCirclePlus,
    text: "메뉴에서 '홈 화면에 추가'를 선택하세요",
  },
  {
    icon: IconDeviceMobile,
    text: "우측 상단의 '추가' 버튼을 탭하면 완료됩니다",
  },
];

const ANDROID_STEPS: PWAInstallStep[] = [
  {
    icon: IconDotsVertical,
    text: "우측 상단의 메뉴(︙) 아이콘을 탭하세요",
  },
  {
    icon: IconCirclePlus,
    text: "'앱 설치' 또는 '홈 화면에 추가'를 선택하세요",
  },
  {
    icon: IconDeviceMobile,
    text: "'설치' 또는 '추가'를 탭하면 완료됩니다",
  },
];

const INSTRUCTIONS_COPY: Record<
  InstructionsKind,
  { title: string; description: string; steps: PWAInstallStep[]; viewEvent: string }
> = {
  ios: {
    title: "홈 화면에 추가하기",
    description:
      "다이소 파인더를 앱처럼 사용해보세요. 아래 단계대로 따라하시면 홈 화면에 추가됩니다.",
    steps: IOS_STEPS,
    viewEvent: "pwa_install_ios_modal_view",
  },
  android: {
    title: "앱으로 설치하기",
    description:
      "다이소 파인더를 앱처럼 사용해보세요. 아래 단계대로 따라하시면 홈 화면에 추가됩니다.",
    steps: ANDROID_STEPS,
    viewEvent: "pwa_install_chrome_modal_view",
  },
};

export function PWAInstallBanner() {
  const { state, hasDeferredPrompt, promptInstall, dismiss } = usePWAInstall();
  const [instructions, setInstructions] = useState<InstructionsKind | null>(
    null,
  );

  const closeInstructions = () => setInstructions(null);

  if (state === "hidden") {
    return instructions ? (
      <PWAInstallInstructions
        {...INSTRUCTIONS_COPY[instructions]}
        onClose={closeInstructions}
      />
    ) : null;
  }

  const handleInstall = () => {
    trackEvent("pwa_install_banner_click", { platform: state });
    if (state === "android" && hasDeferredPrompt) {
      void promptInstall();
      return;
    }
    setInstructions(state);
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
              src="/android-icon-192x192.png"
              alt="다이소 파인더"
              width={40}
              height={40}
              className={css({ flexShrink: 0, borderRadius: "8px" })}
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
      {instructions && (
        <PWAInstallInstructions
          {...INSTRUCTIONS_COPY[instructions]}
          onClose={closeInstructions}
        />
      )}
    </>
  );
}

"use client";

import { trackEvent } from "@/lib/gtag";
import { css } from "@styled-system/css";
import {
  IconCirclePlus,
  IconDeviceMobile,
  IconShare3,
} from "@tabler/icons-react";
import { useEffect } from "react";

interface PWAInstallInstructionsProps {
  onClose: () => void;
}

const steps = [
  {
    icon: IconShare3,
    text: "Safari 하단의 공유 버튼을 탭하세요",
  },
  {
    icon: IconCirclePlus,
    text: "메뉴에서 '홈 화면에 추가'를 선택하세요",
  },
  {
    icon: IconDeviceMobile,
    text: "우측 상단의 '추가' 버튼을 탭하면 완료됩니다",
  },
];

export function PWAInstallInstructions({ onClose }: PWAInstallInstructionsProps) {
  useEffect(() => {
    trackEvent("pwa_install_ios_modal_view");
  }, []);

  return (
    <div className="modal modal-blur show" style={{ display: "block" }}>
      <div
        className={`modal-dialog modal-sm modal-dialog-centered ${css({ maxWidth: "400px", margin: "0 auto", position: "relative", zIndex: 1060 })}`}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">홈 화면에 추가하기</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <p className={css({ marginBottom: "16px", color: "#4a4a4a" })}>
              다이소 파인더를 앱처럼 사용해보세요. 아래 단계대로 따라하시면
              홈 화면에 추가됩니다.
            </p>
            <ol
              className={css({
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: 0,
                margin: 0,
                listStyle: "none",
              })}
            >
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li
                    key={index}
                    className={css({
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    })}
                  >
                    <span
                      className={css({
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: "#ED1C24",
                        color: "white",
                        fontWeight: 600,
                        fontSize: "14px",
                      })}
                    >
                      {index + 1}
                    </span>
                    <Icon
                      width={22}
                      height={22}
                      className={css({ color: "#ED1C24", flexShrink: 0 })}
                    />
                    <span className={css({ fontSize: "14px", lineHeight: 1.5 })}>
                      {step.text}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-red w-100"
              onClick={onClose}
            >
              확인
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" onClick={onClose} />
    </div>
  );
}

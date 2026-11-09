"use client";

import { trackEvent } from "@/lib/gtag";
import { css } from "@styled-system/css";
import type { Icon } from "@tabler/icons-react";
import { useEffect, useId } from "react";

export interface PWAInstallStep {
  icon: Icon;
  text: string;
}

interface PWAInstallInstructionsProps {
  title: string;
  description: string;
  steps: PWAInstallStep[];
  viewEvent: string;
  onClose: () => void;
}

/**
 * 모달이 뜨면 페이지 바탕(#f6f6f8)이 뒷배경(.modal-backdrop)에 가려 어두워진다.
 * Safari 의 상단 바도 같은 정도로 어둡게 맞춰야 바와 화면이 따로 놀지 않는다.
 */
const DIMMED_THEME_COLOR = "#8f929a";

export function PWAInstallInstructions({
  title,
  description,
  steps,
  viewEvent,
  onClose,
}: PWAInstallInstructionsProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    trackEvent(viewEvent);
  }, [viewEvent]);

  useEffect(() => {
    const override = document.createElement("meta");
    override.name = "theme-color";
    override.content = DIMMED_THEME_COLOR;
    document.head.appendChild(override);
    return () => {
      override.remove();
    };
  }, []);

  return (
    <div
      className="modal modal-blur show"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      style={{ display: "block" }}
    >
      <div
        className={`modal-dialog modal-sm modal-dialog-centered ${css({ maxWidth: "400px", margin: "0 auto", position: "relative", zIndex: 1060 })}`}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 id={titleId} className="modal-title">
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="닫기"
              onClick={onClose}
            />
          </div>
          <div className="modal-body">
            <p
              id={descriptionId}
              className={css({ marginBottom: "16px", color: "var(--ink-2)" })}
            >
              {description}
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
                        backgroundColor: "var(--brand)",
                        color: "white",
                        fontWeight: 600,
                        fontSize: "14px",
                      })}
                    >
                      {index + 1}
                    </span>
                    <Icon
                      aria-hidden="true"
                      width={22}
                      height={22}
                      className={css({ color: "var(--brand)", flexShrink: 0 })}
                    />
                    <span
                      className={css({ fontSize: "14px", lineHeight: 1.5 })}
                    >
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

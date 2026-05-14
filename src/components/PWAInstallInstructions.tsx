"use client";

import { trackEvent } from "@/lib/gtag";
import { css } from "@styled-system/css";
import type { Icon } from "@tabler/icons-react";
import { useEffect, useRef } from "react";

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

const LIGHT_THEME_COLOR = "#FFFFFF";

export function PWAInstallInstructions({
  title,
  description,
  steps,
  viewEvent,
  onClose,
}: PWAInstallInstructionsProps) {
  const originalThemeColorRef = useRef<string | null>(null);

  useEffect(() => {
    trackEvent(viewEvent);
  }, [viewEvent]);

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!meta) return;
    originalThemeColorRef.current = meta.getAttribute("content");
    meta.setAttribute("content", LIGHT_THEME_COLOR);
    return () => {
      if (originalThemeColorRef.current !== null) {
        meta.setAttribute("content", originalThemeColorRef.current);
      }
    };
  }, []);

  return (
    <div className="modal modal-blur show" style={{ display: "block" }}>
      <div
        className={`modal-dialog modal-sm modal-dialog-centered ${css({ maxWidth: "400px", margin: "0 auto", position: "relative", zIndex: 1060 })}`}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <p className={css({ marginBottom: "16px", color: "#4a4a4a" })}>
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

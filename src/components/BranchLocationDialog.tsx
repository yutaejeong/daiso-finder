"use client";

import { SimplifiedBranch } from "@/app/api/branches/types";
import { trackEvent } from "@/lib/gtag";
import { css } from "@styled-system/css";
import {
  IconCopy,
  IconMapPin,
  IconRoute,
} from "@tabler/icons-react";
import { useId, useRef, useState } from "react";

interface Props {
  branch: SimplifiedBranch;
}

type CopyStatus = "copied" | "failed" | null;

function createOpenStreetMapUrl(lat: number, lng: number) {
  const latitudeDelta = 0.003;
  const longitudeDelta = 0.004;
  const bounds = [
    lng - longitudeDelta,
    lat - latitudeDelta,
    lng + longitudeDelta,
    lat + latitudeDelta,
  ]
    .map((coordinate) => coordinate.toFixed(6))
    .join(",");

  const params = new URLSearchParams({
    bbox: bounds,
    layer: "mapnik",
    marker: `${lat},${lng}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

function copyTextWithFallback(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Clipboard copy failed");
  }
}

export function BranchLocationDialog({ branch }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);

  const kakaoDirectionsUrl = `https://map.kakao.com/link/to/${encodeURIComponent(`다이소 ${branch.name}`)},${branch.lat},${branch.lng}`;
  const mapUrl = createOpenStreetMapUrl(branch.lat, branch.lng);

  const openDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;

    setIsOpen(true);
    setCopyStatus(null);
    dialog.showModal();
    trackEvent("branch_address_click", { branch_code: branch.code });
  };

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  const handleCopyAddress = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(branch.address);
      } else {
        copyTextWithFallback(branch.address);
      }

      setCopyStatus("copied");
      trackEvent("branch_address_copy", { branch_code: branch.code });
    } catch {
      try {
        copyTextWithFallback(branch.address);
        setCopyStatus("copied");
        trackEvent("branch_address_copy", { branch_code: branch.code });
      } catch {
        setCopyStatus("failed");
      }
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDialog}
        className={css({
          padding: 0,
          color: "inherit",
          background: "none",
          border: 0,
          cursor: "pointer",
          textAlign: "left",
          textDecoration: "underline",
          textUnderlineOffset: "2px",
          _hover: { color: "#c4002f" },
          _focusVisible: {
            outline: "2px solid #c4002f",
            outlineOffset: "3px",
            borderRadius: "2px",
          },
        })}
      >
        {branch.address}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => {
          setIsOpen(false);
          setCopyStatus(null);
          triggerRef.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
        className={css({
          width: "calc(100% - 32px)",
          maxWidth: "448px",
          maxHeight: "calc(100dvh - 32px)",
          margin: "auto",
          padding: 0,
          color: "#1f2937",
          backgroundColor: "white",
          border: 0,
          borderRadius: "12px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.24)",
          overflow: "hidden",
          "&::backdrop": {
            backgroundColor: "rgba(17, 24, 39, 0.48)",
            backdropFilter: "blur(2px)",
          },
        })}
      >
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100dvh - 32px)",
          })}
        >
          <div
            className={css({
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              padding: "18px 18px 16px",
              borderBottom: "1px solid #e5e7eb",
            })}
          >
            <div className={css({ minWidth: 0 })}>
              <h2
                id={titleId}
                className={css({
                  margin: 0,
                  fontSize: "1.125rem",
                  lineHeight: 1.4,
                  color: "#111827",
                  wordBreak: "keep-all",
                })}
              >
                {branch.name} 위치
              </h2>
              <p
                id={descriptionId}
                className={css({
                  margin: "4px 0 0",
                  color: "#4b5563",
                  fontSize: "0.8125rem",
                  lineHeight: 1.45,
                  wordBreak: "keep-all",
                })}
              >
                {branch.address}
              </p>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="위치 다이얼로그 닫기"
              onClick={closeDialog}
            />
          </div>

          <div
            className={css({
              position: "relative",
              height: "240px",
              flexShrink: 0,
              overflow: "hidden",
              backgroundColor: "#e5e7eb",
            })}
          >
            {isOpen && (
              <iframe
                src={mapUrl}
                title={`${branch.name} 지도`}
                loading="lazy"
                className={css({
                  width: "100%",
                  height: "100%",
                  border: 0,
                })}
              />
            )}
            <div
              aria-hidden="true"
              className={css({
                position: "absolute",
                top: "12px",
                left: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                maxWidth: "calc(100% - 24px)",
                padding: "7px 10px",
                color: "#111827",
                backgroundColor: "rgba(255, 255, 255, 0.94)",
                borderRadius: "999px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.14)",
                fontSize: "0.75rem",
                fontWeight: 700,
                pointerEvents: "none",
              })}
            >
              <IconMapPin width={16} height={16} color="#c4002f" />
              <span
                className={css({
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                })}
              >
                다이소 {branch.name}
              </span>
            </div>
          </div>

          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              padding: "16px 18px 18px",
            })}
          >
            <a
              href={kakaoDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("branch_directions_click", {
                  branch_code: branch.code,
                })
              }
              className={`btn btn-red ${css({
                width: "100%",
                minHeight: "46px",
                fontWeight: 700,
              })}`}
            >
              <IconRoute width={20} height={20} aria-hidden="true" />
              카카오맵 길찾기
            </a>
            <button
              type="button"
              onClick={handleCopyAddress}
              className={css({
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                width: "100%",
                minHeight: "46px",
                padding: "0.4375rem 0.875rem",
                color: "#1f2937",
                backgroundColor: "white",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontWeight: 700,
                lineHeight: 1.4286,
                cursor: "pointer",
                userSelect: "none",
                transition:
                  "background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease",
                _hover: {
                  backgroundColor: "#f9fafb",
                  borderColor: "#9ca3af",
                },
                _focusVisible: {
                  outline: "none",
                  boxShadow: "0 0 0 0.25rem rgba(196, 0, 47, 0.25)",
                },
              })}
            >
              <IconCopy width={20} height={20} aria-hidden="true" />
              주소 복사
            </button>
            <p
              role="status"
              aria-live="polite"
              className={css({
                minHeight: "20px",
                margin: "-2px 0 -6px",
                color: copyStatus === "failed" ? "#b42318" : "#166534",
                fontSize: "0.8125rem",
                lineHeight: "20px",
                textAlign: "center",
              })}
            >
              {copyStatus === "copied" && "주소를 복사했습니다."}
              {copyStatus === "failed" &&
                "주소를 복사하지 못했습니다. 다시 시도해주세요."}
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}

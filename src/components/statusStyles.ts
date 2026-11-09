import { css } from "@styled-system/css";

/** 404·오류 화면처럼 한가운데에 상태를 알리는 카드의 공통 스타일. */
export const statusCardClass = css({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "18px",
  textAlign: "center",
  padding: "32px 20px",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-lg)",
  backgroundColor: "var(--surface)",
  boxShadow: "var(--shadow-1)",
});

export const statusIconClass = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "68px",
  height: "68px",
  color: "var(--brand)",
  backgroundColor: "var(--brand-tint)",
  borderRadius: "50%",
});

export const statusTitleClass = css({
  marginBottom: "8px",
  fontSize: "1.375rem",
  lineHeight: 1.35,
  wordBreak: "keep-all",
});

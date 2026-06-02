import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CSSProperties } from "react";

export const ogImageSize = {
  width: 1200,
  height: 630,
};

export const ogImageContentType = "image/png";

type DaisoOgImageOptions = {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge: string;
  footer?: string;
};

let ogFontPromise: Promise<ArrayBuffer> | null = null;

function getOgFont() {
  ogFontPromise ??= readFile(
    join(process.cwd(), "src/app/NotoSansCJKkr-Regular.otf"),
  ).then((buffer) =>
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
  ) as Promise<ArrayBuffer>;

  return ogFontPromise;
}

function getTitleFontSize(title: string) {
  const longestLine = Math.max(...title.split("\n").map((line) => line.length));

  if (title.includes("\n")) {
    if (longestLine >= 16) return 50;
    if (longestLine >= 11) return 58;
    return 66;
  }

  if (longestLine >= 22) return 48;
  if (longestLine >= 18) return 56;
  if (longestLine >= 14) return 64;
  return 86;
}

const rootStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  position: "relative",
  overflow: "hidden",
  backgroundColor: "#fbfaf8",
  color: "#111111",
  fontFamily: "Noto Sans KR",
  letterSpacing: 0,
} satisfies CSSProperties;

const logoMarkStyle = {
  width: 116,
  height: 116,
  borderRadius: 30,
  backgroundColor: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
} satisfies CSSProperties;

const featureChipStyle = {
  minWidth: 142,
  height: 58,
  padding: "0 22px",
  border: "1px solid #dedbd5",
  borderRadius: 999,
  backgroundColor: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#2d2a26",
  fontSize: 24,
  fontWeight: 700,
} satisfies CSSProperties;

export async function createDaisoOgImage({
  eyebrow,
  title,
  subtitle,
  badge,
  footer = "daiso-finder.kr",
}: DaisoOgImageOptions) {
  const ogFont = await getOgFont();
  const titleFontSize = getTitleFontSize(title);

  return new ImageResponse(
    (
      <div style={rootStyle}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 14,
            backgroundColor: "#ed1c24",
            display: "flex",
          }}
        />
        <div
          style={{
            width: 360,
            height: "100%",
            padding: "54px 46px 50px",
            backgroundColor: "#ed1c24",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={logoMarkStyle}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  border: "14px solid #ed1c24",
                  borderRadius: 999,
                  display: "flex",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 26,
                  bottom: 20,
                  width: 22,
                  height: 58,
                  borderRadius: 999,
                  backgroundColor: "#ed1c24",
                  transform: "rotate(-45deg)",
                  display: "flex",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 38,
                display: "flex",
                flexDirection: "column",
                fontSize: 44,
                lineHeight: 1.02,
                fontWeight: 900,
              }}
            >
              <span>Daiso</span>
              <span>Finder</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 22,
              lineHeight: 1.45,
              opacity: 0.92,
            }}
          >
            <span>상품 재고</span>
            <span>가격</span>
            <span>진열 위치</span>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            height: "100%",
            padding: "66px 70px 54px 66px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                alignSelf: "flex-start",
                padding: "12px 20px",
                borderRadius: 999,
                backgroundColor: "#111111",
                color: "#ffffff",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              {eyebrow}
            </div>

            <div
              style={{
                marginTop: 38,
                display: "flex",
                flexDirection: "column",
                color: "#111111",
                fontSize: titleFontSize,
                lineHeight: 1.08,
                fontWeight: 900,
                maxWidth: 770,
              }}
            >
              {title.split("\n").map((line) => (
                <span key={line} style={{ display: "flex" }}>
                  {line}
                </span>
              ))}
            </div>

            <div
              style={{
                marginTop: 28,
                display: "flex",
                maxWidth: 720,
                color: "#55514b",
                fontSize: 29,
                lineHeight: 1.38,
                fontWeight: 600,
              }}
            >
              {subtitle}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {["재고 확인", "가격 보기", "진열 위치"].map((label, index) => (
                <div
                  key={label}
                  style={{
                    ...featureChipStyle,
                    marginLeft: index === 0 ? 0 : 14,
                  }}
                >
                  {label}
                </div>
              ))}
              <div
                style={{
                  marginLeft: 18,
                  padding: "0 24px",
                  height: 58,
                  borderRadius: 999,
                  backgroundColor: "#ed1c24",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 800,
                }}
              >
                {badge}
              </div>
            </div>

            <div
              style={{
                marginTop: 34,
                paddingTop: 24,
                borderTop: "1px solid #dedbd5",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "#817a70",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              <span>다이소 파인더</span>
              <span>{footer}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...ogImageSize,
      fonts: [
        {
          name: "Noto Sans KR",
          data: ogFont,
          style: "normal",
        },
      ],
    },
  );
}

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

const daisoRed = "#e60033";
const ink = "#111111";
const muted = "#5f6368";
const line = "#e7e7e7";

let ogFontPromise: Promise<ArrayBuffer> | null = null;
let logoSrcPromise: Promise<string> | null = null;

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

function getLogoSrc() {
  logoSrcPromise ??= readFile(
    join(process.cwd(), "public/logo.svg"),
    "utf8",
  ).then(
    (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
  );

  return logoSrcPromise;
}

function getTitleFontSize(title: string) {
  const longestLine = Math.max(...title.split("\n").map((line) => line.length));

  if (title.includes("\n")) {
    if (longestLine >= 15) return 64;
    if (longestLine >= 11) return 72;
    return 80;
  }

  if (longestLine >= 20) return 70;
  if (longestLine >= 15) return 80;
  return 92;
}

const rootStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  backgroundColor: "#f6f7f8",
  color: ink,
  fontFamily: "Noto Sans KR",
  letterSpacing: 0,
  padding: 34,
} satisfies CSSProperties;

const cardStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  backgroundColor: "#ffffff",
  border: `1px solid ${line}`,
  borderRadius: 8,
  padding: "46px 54px 42px",
  position: "relative",
  overflow: "hidden",
} satisfies CSSProperties;

function FeatureText({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        color: ink,
        fontSize: 25,
        fontWeight: 800,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: daisoRed,
          display: "flex",
          marginRight: 11,
        }}
      />
      {children}
    </div>
  );
}

export async function createDaisoOgImage({
  eyebrow,
  title,
  subtitle,
  badge,
  footer = "daiso-finder.kr",
}: DaisoOgImageOptions) {
  const [ogFont, logoSrc] = await Promise.all([getOgFont(), getLogoSrc()]);
  const titleFontSize = getTitleFontSize(title);

  return new ImageResponse(
    (
      <div style={rootStyle}>
        <div style={cardStyle}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 12,
              backgroundColor: daisoRed,
              display: "flex",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="다이소 파인더"
              width={248}
              height={98}
              style={{ objectFit: "contain" }}
            />
            <div
              style={{
                display: "flex",
                color: muted,
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              {footer}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: daisoRed,
                fontSize: 26,
                fontWeight: 900,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 4,
                  backgroundColor: daisoRed,
                  display: "flex",
                  marginRight: 16,
                }}
              />
              {eyebrow}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 26,
                color: ink,
                fontSize: titleFontSize,
                lineHeight: 1.05,
                fontWeight: 900,
                maxWidth: 960,
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
                display: "flex",
                marginTop: 28,
                color: muted,
                fontSize: 31,
                lineHeight: 1.36,
                fontWeight: 700,
                maxWidth: 920,
              }}
            >
              {subtitle}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `1px solid ${line}`,
              paddingTop: 28,
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <FeatureText>재고 확인</FeatureText>
              <div style={{ display: "flex", marginLeft: 44 }}>
                <FeatureText>가격 확인</FeatureText>
              </div>
              <div style={{ display: "flex", marginLeft: 44 }}>
                <FeatureText>진열 위치</FeatureText>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 48,
                padding: "0 22px",
                borderRadius: 999,
                backgroundColor: "#fff1f4",
                color: daisoRed,
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              {badge}
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

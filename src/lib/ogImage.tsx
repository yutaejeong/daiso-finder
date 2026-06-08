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
const line = "#e7e7e7";
const titleStrokeOffsets = [
  { x: 0, y: 0 },
  { x: 0.75, y: 0 },
  { x: -0.75, y: 0 },
  { x: 0, y: 0.75 },
  { x: 0, y: -0.75 },
] as const;

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
    if (longestLine >= 15) return 78;
    if (longestLine >= 11) return 86;
    return 94;
  }

  if (longestLine >= 20) return 82;
  if (longestLine >= 15) return 94;
  return 108;
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
  justifyContent: "center",
  backgroundColor: "#ffffff",
  border: `1px solid ${line}`,
  borderRadius: 8,
  padding: "58px 72px 58px 88px",
  position: "relative",
  overflow: "hidden",
} satisfies CSSProperties;

export async function createDaisoOgImage({ title }: DaisoOgImageOptions) {
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
              width: 14,
              backgroundColor: daisoRed,
              display: "flex",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="다이소 파인더"
              width={276}
              height={109}
              style={{ objectFit: "contain" }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 74,
                color: ink,
                fontSize: titleFontSize,
                lineHeight: 1.02,
                fontWeight: 900,
                maxWidth: 1020,
              }}
            >
              {title.split("\n").map((line) => (
                <span
                  key={line}
                  style={{
                    display: "flex",
                    position: "relative",
                    height: titleFontSize * 1.02,
                  }}
                >
                  {titleStrokeOffsets.map(({ x, y }) => (
                    <span
                      key={`${line}-${x}-${y}`}
                      style={{
                        position: x === 0 && y === 0 ? "relative" : "absolute",
                        left: x,
                        top: y,
                        display: "flex",
                      }}
                    >
                      {line}
                    </span>
                  ))}
                </span>
              ))}
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

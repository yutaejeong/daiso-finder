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
const ink = "#171717";
const muted = "#5f6267";
const subtle = "#8d9298";
const line = "#dedede";
const surface = "#f6f7f8";
const panel = "#fbfbfb";
const success = "#138a43";

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
    if (longestLine >= 15) return 48;
    if (longestLine >= 11) return 54;
    return 60;
  }

  if (longestLine >= 20) return 56;
  if (longestLine >= 15) return 64;
  return 76;
}

function getPreviewStoreName(title: string) {
  const firstLine = title.split("\n")[0];

  if (firstLine.includes("다이소") && !firstLine.includes("상품 찾기")) {
    return firstLine;
  }

  return "선택한 다이소 매장";
}

const rootStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  backgroundColor: surface,
  color: ink,
  fontFamily: "Noto Sans KR",
  letterSpacing: 0,
  padding: 32,
} satisfies CSSProperties;

const frameStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  backgroundColor: "#ffffff",
  border: `1px solid ${line}`,
  borderRadius: 8,
  overflow: "hidden",
} satisfies CSSProperties;

const leftStyle = {
  width: 694,
  height: "100%",
  padding: "40px 54px 34px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
} satisfies CSSProperties;

const rightStyle = {
  flex: 1,
  height: "100%",
  backgroundColor: panel,
  borderLeft: `1px solid ${line}`,
  padding: "42px 38px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} satisfies CSSProperties;

const previewStyle = {
  width: 384,
  height: 482,
  backgroundColor: "#ffffff",
  border: `1px solid ${line}`,
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
} satisfies CSSProperties;

const previewHeaderStyle = {
  height: 72,
  borderBottom: `1px solid ${line}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 22px",
} satisfies CSSProperties;

const searchBarStyle = {
  height: 60,
  border: `1px solid ${line}`,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#ffffff",
  overflow: "hidden",
} satisfies CSSProperties;

const resultCardStyle = {
  border: `1px solid ${line}`,
  borderRadius: 8,
  backgroundColor: "#ffffff",
  display: "flex",
  flexDirection: "column",
} satisfies CSSProperties;

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        paddingLeft: 18,
        borderLeft: `4px solid ${daisoRed}`,
      }}
    >
      <span
        style={{
          display: "flex",
          color: subtle,
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "flex",
          marginTop: 7,
          color: ink,
          fontSize: 28,
          fontWeight: 900,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SearchMock({ badge }: { badge: string }) {
  return (
    <div style={searchBarStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingLeft: 24,
          color: subtle,
          fontSize: 23,
          fontWeight: 700,
        }}
      >
        상품명 또는 매장명을 검색
      </div>
      <div
        style={{
          width: 132,
          height: "100%",
          backgroundColor: daisoRed,
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: 900,
        }}
      >
        {badge}
      </div>
    </div>
  );
}

function PreviewPanel({
  badge,
  storeName,
}: {
  badge: string;
  storeName: string;
}) {
  return (
    <div style={previewStyle}>
      <div style={{ height: 6, backgroundColor: daisoRed, display: "flex" }} />
      <div style={previewHeaderStyle}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: ink,
          }}
        >
          <span style={{ display: "flex", fontSize: 18, color: muted }}>
            현재 매장
          </span>
          <span
            style={{
              display: "flex",
              marginTop: 4,
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            {storeName}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            padding: "6px 10px",
            borderRadius: 6,
            backgroundColor: "#eef8f1",
            color: success,
            fontSize: 17,
            fontWeight: 900,
          }}
        >
          영업중
        </div>
      </div>

      <div
        style={{
          padding: "22px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: 48,
            border: `1px solid ${line}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: subtle,
            fontSize: 18,
            fontWeight: 700,
            overflow: "hidden",
          }}
        >
          <span style={{ display: "flex", paddingLeft: 16 }}>검색어 입력</span>
          <span
            style={{
              width: 88,
              height: "100%",
              backgroundColor: daisoRed,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            {badge}
          </span>
        </div>

        <div style={{ ...resultCardStyle, marginTop: 18, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 74,
                height: 98,
                borderRadius: 6,
                border: `1px solid ${line}`,
                backgroundColor: "#f2f2f2",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: 10,
              }}
            >
              <div
                style={{
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: daisoRed,
                  display: "flex",
                }}
              />
              <div
                style={{
                  height: 38,
                  borderRadius: 4,
                  backgroundColor: "#ffffff",
                  border: `1px solid ${line}`,
                  display: "flex",
                }}
              />
              <div
                style={{
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: "#cfcfcf",
                  display: "flex",
                }}
              />
            </div>
            <div
              style={{
                marginLeft: 16,
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <span
                style={{
                  display: "flex",
                  color: ink,
                  fontSize: 22,
                  lineHeight: 1.25,
                  fontWeight: 900,
                }}
              >
                수납 바구니
              </span>
              <span
                style={{
                  display: "flex",
                  marginTop: 9,
                  color: muted,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                3,000원
              </span>
              <div style={{ display: "flex", marginTop: 13 }}>
                <span
                  style={{
                    display: "flex",
                    padding: "5px 8px",
                    borderRadius: 6,
                    backgroundColor: "#eef8f1",
                    color: success,
                    fontSize: 16,
                    fontWeight: 900,
                  }}
                >
                  재고 12개
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 18,
              paddingTop: 16,
              borderTop: `1px solid ${line}`,
              justifyContent: "space-between",
              color: ink,
              fontSize: 19,
              fontWeight: 800,
            }}
          >
            <span>층수 2층</span>
            <span>위치 B-03</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            color: subtle,
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          daiso-finder.kr
        </div>
      </div>
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
  const storeName = getPreviewStoreName(title);
  const isBranchImage = title.includes("\n");

  return new ImageResponse(
    (
      <div style={rootStyle}>
        <div style={frameStyle}>
          <div style={leftStyle}>
            <div style={{ display: "flex", flexDirection: "column" }}>
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
                  width={222}
                  height={88}
                  style={{ objectFit: "contain" }}
                />
                <div
                  style={{
                    display: "flex",
                    color: muted,
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  {footer}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 34,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 4,
                    backgroundColor: daisoRed,
                    display: "flex",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    marginLeft: 14,
                    color: daisoRed,
                    fontSize: 22,
                    fontWeight: 900,
                  }}
                >
                  {eyebrow}
                </div>
              </div>

              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  flexDirection: "column",
                  color: ink,
                  fontSize: titleFontSize,
                  lineHeight: 1.08,
                  fontWeight: 900,
                  maxWidth: 580,
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
                  marginTop: 18,
                  maxWidth: 590,
                  color: muted,
                  fontSize: 25,
                  lineHeight: 1.35,
                  fontWeight: 700,
                }}
              >
                {subtitle}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <SearchMock badge={badge} />
              {isBranchImage ? (
                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    color: muted,
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  재고 확인 · 가격 확인 · 진열 위치
                </div>
              ) : (
                <div
                  style={{
                    marginTop: 18,
                    display: "flex",
                    justifyContent: "space-between",
                    maxWidth: 570,
                  }}
                >
                  <StatItem label="매장별" value="재고 확인" />
                  <StatItem label="상품별" value="가격 확인" />
                  <StatItem label="진열대" value="층수/구역" />
                </div>
              )}
            </div>
          </div>

          <div style={rightStyle}>
            <PreviewPanel badge={badge} storeName={storeName} />
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

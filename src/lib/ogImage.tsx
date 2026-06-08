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
const ink = "#141414";
const muted = "#64605a";
const line = "#e4e1dc";
const paper = "#fffdfa";
const soft = "#f4f5f7";
const sun = "#ffc928";
const blue = "#2f66f6";

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
    if (longestLine >= 17) return 46;
    if (longestLine >= 13) return 54;
    if (longestLine >= 10) return 62;
    return 70;
  }

  if (longestLine >= 22) return 48;
  if (longestLine >= 18) return 56;
  if (longestLine >= 14) return 64;
  return 82;
}

const rootStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  position: "relative",
  overflow: "hidden",
  backgroundColor: soft,
  color: ink,
  fontFamily: "Noto Sans KR",
  letterSpacing: 0,
  padding: 28,
} satisfies CSSProperties;

const logoMarkStyle = {
  width: 112,
  height: 112,
  borderRadius: 28,
  backgroundColor: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
} satisfies CSSProperties;

const featureCardStyle = {
  width: 150,
  height: 96,
  border: `1px solid ${line}`,
  borderRadius: 20,
  backgroundColor: "#ffffff",
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
} satisfies CSSProperties;

const featureDotStyle = {
  width: 14,
  height: 14,
  borderRadius: 999,
  display: "flex",
} satisfies CSSProperties;

function LogoMark() {
  return (
    <div style={logoMarkStyle}>
      <div
        style={{
          width: 55,
          height: 55,
          border: `14px solid ${daisoRed}`,
          borderRadius: 999,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 24,
          bottom: 20,
          width: 23,
          height: 58,
          borderRadius: 999,
          backgroundColor: daisoRed,
          transform: "rotate(-45deg)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 52,
          top: 36,
          width: 22,
          height: 33,
          borderRadius: "18px 0 0 18px",
          backgroundColor: "#ffffff",
          display: "flex",
        }}
      />
    </div>
  );
}

function FeatureCard({
  dotColor,
  label,
  value,
}: {
  dotColor: string;
  label: string;
  value: string;
}) {
  return (
    <div style={featureCardStyle}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ ...featureDotStyle, backgroundColor: dotColor }} />
        <div
          style={{
            marginLeft: 9,
            color: muted,
            fontSize: 20,
            fontWeight: 800,
            display: "flex",
          }}
        >
          {label}
        </div>
      </div>
      <div
        style={{
          color: ink,
          fontSize: 27,
          fontWeight: 900,
          display: "flex",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ShelfPreview({ badge }: { badge: string }) {
  return (
    <div
      style={{
        width: 255,
        height: 178,
        borderRadius: 28,
        backgroundColor: "#ffffff",
        border: `1px solid ${line}`,
        padding: "20px 20px 18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -18,
          right: 24,
          padding: "9px 15px",
          borderRadius: 999,
          backgroundColor: ink,
          color: "#ffffff",
          fontSize: 19,
          fontWeight: 800,
          display: "flex",
        }}
      >
        {badge}
      </div>
      {[
        [daisoRed, sun, "#ffffff", blue],
        [blue, "#ffffff", daisoRed, sun],
        [sun, daisoRed, blue, "#ffffff"],
      ].map((colors, rowIndex) => (
        <div
          key={`shelf-${rowIndex}`}
          style={{
            height: 38,
            borderRadius: 12,
            backgroundColor: "#f0eee9",
            padding: "6px 8px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {colors.map((color, index) => (
            <div
              key={`${color}-${index}`}
              style={{
                width: index === 1 ? 45 : 34,
                height: 26,
                marginLeft: index === 0 ? 0 : 8,
                borderRadius: 8,
                backgroundColor: color,
                border: color === "#ffffff" ? `1px solid ${line}` : "none",
                display: "flex",
              }}
            />
          ))}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          right: 26,
          bottom: 20,
          width: 54,
          height: 54,
          borderRadius: 999,
          backgroundColor: daisoRed,
          border: "5px solid #ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            backgroundColor: "#ffffff",
            display: "flex",
          }}
        />
      </div>
    </div>
  );
}

const watermarkStyle = {
  position: "absolute",
  right: 36,
  top: 26,
  width: 210,
  height: 210,
  borderRadius: 999,
  border: "26px solid rgba(230, 0, 51, 0.06)",
  display: "flex",
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
            left: 0,
            bottom: 0,
            width: "100%",
            height: 14,
            backgroundColor: daisoRed,
            display: "flex",
          }}
        />
        <div
          style={{
            width: 322,
            height: "100%",
            padding: "34px 28px",
            borderRadius: 32,
            backgroundColor: daisoRed,
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -58,
              bottom: -58,
              width: 210,
              height: 210,
              borderRadius: 999,
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -24,
              top: 30,
              width: 88,
              height: 88,
              borderRadius: 24,
              backgroundColor: sun,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 40,
              bottom: 92,
              width: 22,
              height: 88,
              borderRadius: 999,
              backgroundColor: blue,
              display: "flex",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <LogoMark />
            <div
              style={{
                marginTop: 32,
                display: "flex",
                flexDirection: "column",
                fontSize: 42,
                lineHeight: 1.02,
                fontWeight: 900,
              }}
            >
              <span>Daiso</span>
              <span>Finder</span>
            </div>
            <div
              style={{
                marginTop: 18,
                width: 82,
                height: 6,
                borderRadius: 999,
                backgroundColor: sun,
                display: "flex",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                marginBottom: 24,
                display: "flex",
                flexDirection: "column",
                color: "rgba(255, 255, 255, 0.86)",
                fontSize: 19,
                lineHeight: 1.5,
                fontWeight: 700,
              }}
            >
              <span>상품 재고</span>
              <span>가격</span>
              <span>층별 진열 위치</span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                paddingTop: 22,
                borderTop: "1px solid rgba(255, 255, 255, 0.28)",
                fontSize: 20,
                lineHeight: 1.35,
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              <span>다이소 파인더</span>
              <span style={{ opacity: 0.76 }}>{footer}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            height: "100%",
            marginLeft: 24,
            padding: "40px 46px 34px",
            borderRadius: 32,
            backgroundColor: paper,
            border: `1px solid ${line}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={watermarkStyle} />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  padding: "11px 18px",
                  borderRadius: 999,
                  backgroundColor: ink,
                  color: "#ffffff",
                  fontSize: 21,
                  fontWeight: 800,
                }}
              >
                {eyebrow}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: muted,
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                daiso-finder.kr
              </div>
            </div>

            <div
              style={{
                marginTop: 34,
                display: "flex",
                flexDirection: "column",
                color: ink,
                fontSize: titleFontSize,
                lineHeight: 1.06,
                fontWeight: 900,
                maxWidth: 690,
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
                marginTop: 24,
                display: "flex",
                maxWidth: 655,
                color: muted,
                fontSize: 28,
                lineHeight: 1.34,
                fontWeight: 700,
              }}
            >
              {subtitle}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <FeatureCard dotColor={daisoRed} label="재고" value="실시간" />
              <div style={{ marginLeft: 14, display: "flex" }}>
                <FeatureCard dotColor={sun} label="가격" value="빠르게" />
              </div>
              <div style={{ marginLeft: 14, display: "flex" }}>
                <FeatureCard dotColor={blue} label="위치" value="층/구역" />
              </div>
            </div>
            <ShelfPreview badge={badge} />
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

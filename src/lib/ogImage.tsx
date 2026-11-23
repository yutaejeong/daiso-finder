import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CSSProperties } from "react";

export const ogImageSize = {
  width: 1200,
  height: 630,
};

export const ogImageContentType = "image/png";

export type DaisoOgImageOptions = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  footer?: string;
};

export type ProductOgImageOptions = {
  branchName: string;
  productName: string;
  price?: number | null;
  productImageUrl?: string | null;
  footer?: string;
};

const daisoRed = "#e60033";
const ink = "#111111";
const muted = "#5f6368";
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

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DaisoFinderBot/1.0)",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const mime = res.headers.get("content-type") || "image/jpeg";
    return `data:${mime};base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    return null;
  }
}

function getTitleFontSize(title: string) {
  const longestLine = Math.max(...title.split("\n").map((line) => line.length));

  if (title.includes("\n")) {
    if (longestLine >= 15) return 66;
    if (longestLine >= 11) return 74;
    return 84;
  }

  if (longestLine >= 20) return 68;
  if (longestLine >= 15) return 78;
  return 88;
}

function getProductTitleFontSize(title: string) {
  if (title.length >= 24) return 46;
  if (title.length >= 16) return 54;
  return 62;
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
  borderRadius: 16,
  padding: "48px 56px 44px 72px",
  position: "relative",
  overflow: "hidden",
} satisfies CSSProperties;

export async function createDaisoOgImage({
  eyebrow = "다이소 매장·상품 찾기",
  title,
  subtitle = "매장별 상품 재고, 가격, 진열 위치(층·구역)를 확인하세요.",
  badge = "실시간 재고 조회",
  footer = "daiso-finder.kr",
}: DaisoOgImageOptions) {
  const [ogFont, logoSrc] = await Promise.all([getOgFont(), getLogoSrc()]);
  const titleFontSize = getTitleFontSize(title);

  return new ImageResponse(
    (
      <div style={rootStyle}>
        <div style={cardStyle}>
          {/* 왼쪽 레드 브랜드 바 */}
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

          {/* 상단 헤더: 로고 + 뱃지 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="다이소 파인더"
              width={240}
              height={95}
              style={{ objectFit: "contain" }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 20px",
                  borderRadius: 9999,
                  backgroundColor: "#fff0f3",
                  border: "1px solid #ffd1da",
                  color: daisoRed,
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                {badge}
              </div>
            </div>
          </div>

          {/* 중앙 콘텐츠: Eyebrow + Title + Subtitle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            {/* Eyebrow */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 4,
                  backgroundColor: daisoRed,
                  borderRadius: 2,
                  display: "flex",
                  marginRight: 10,
                }}
              />
              <span
                style={{
                  color: daisoRed,
                  fontSize: 24,
                  fontWeight: 900,
                  display: "flex",
                }}
              >
                {eyebrow}
              </span>
            </div>

            {/* 타이틀 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                color: ink,
                fontSize: titleFontSize,
                lineHeight: 1.08,
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
                    height: titleFontSize * 1.08,
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

            {/* 서브타이틀 */}
            <div
              style={{
                display: "flex",
                marginTop: 18,
                color: muted,
                fontSize: 26,
                fontWeight: 700,
                lineHeight: 1.35,
                maxWidth: 980,
              }}
            >
              {subtitle}
            </div>
          </div>

          {/* 하단 푸터: 특징 태그 목록 + 도메인 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              paddingTop: 16,
              borderTop: `1px solid ${line}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 20,
                  fontWeight: 800,
                  color: ink,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: daisoRed,
                    display: "flex",
                    marginRight: 8,
                  }}
                />
                실시간 재고 확인
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 20,
                  fontWeight: 800,
                  color: ink,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: daisoRed,
                    display: "flex",
                    marginRight: 8,
                  }}
                />
                진열 위치(층·구역)
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 20,
                  fontWeight: 800,
                  color: ink,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: daisoRed,
                    display: "flex",
                    marginRight: 8,
                  }}
                />
                매장별 가격 정보
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 800,
                color: muted,
              }}
            >
              {footer}
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

export async function createProductOgImage({
  branchName,
  productName,
  price,
  productImageUrl,
  footer = "daiso-finder.kr",
}: ProductOgImageOptions) {
  const [ogFont, logoSrc, imageBase64] = await Promise.all([
    getOgFont(),
    getLogoSrc(),
    productImageUrl ? fetchImageAsBase64(productImageUrl) : Promise.resolve(null),
  ]);

  const titleFontSize = getProductTitleFontSize(productName);

  return new ImageResponse(
    (
      <div style={rootStyle}>
        <div style={cardStyle}>
          {/* 왼쪽 레드 브랜드 바 */}
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

          {/* 상단 헤더: 로고 + 뱃지 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="다이소 파인더"
              width={220}
              height={87}
              style={{ objectFit: "contain" }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 18px",
                borderRadius: 9999,
                backgroundColor: "#fff0f3",
                border: "1px solid #ffd1da",
                color: daisoRed,
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              매장 재고·위치 상세
            </div>
          </div>

          {/* 본문: 좌측 정보 + 우측 이미지 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: 36,
              margin: "auto 0",
            }}
          >
            {/* 좌측: 지점명, 상품명, 가격, 특징 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minWidth: 0,
              }}
            >
              {/* 지점명 칩 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 4,
                    backgroundColor: daisoRed,
                    borderRadius: 2,
                    display: "flex",
                    marginRight: 10,
                  }}
                />
                <span
                  style={{
                    color: daisoRed,
                    fontSize: 24,
                    fontWeight: 900,
                    display: "flex",
                  }}
                >
                  {branchName}
                </span>
              </div>

              {/* 상품명 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  color: ink,
                  fontSize: titleFontSize,
                  lineHeight: 1.15,
                  fontWeight: 900,
                  wordBreak: "keep-all",
                }}
              >
                {titleStrokeOffsets.map(({ x, y }) => (
                  <span
                    key={`p-${x}-${y}`}
                    style={{
                      position: x === 0 && y === 0 ? "relative" : "absolute",
                      left: x,
                      top: y,
                      display: "flex",
                    }}
                  >
                    {productName}
                  </span>
                ))}
              </div>

              {/* 가격 및 상태 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginTop: 20,
                }}
              >
                {price !== null && price !== undefined ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 4,
                      fontSize: 38,
                      fontWeight: 900,
                      color: ink,
                    }}
                  >
                    <span>{price.toLocaleString()}</span>
                    <span style={{ fontSize: 26, fontWeight: 700 }}>원</span>
                  </div>
                ) : null}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 14px",
                    borderRadius: 8,
                    backgroundColor: "#f0f1f4",
                    color: "#3b3f4a",
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  실시간 재고·진열 위치 안내
                </div>
              </div>
            </div>

            {/* 우측: 상품 사진 or 아이콘 카드 */}
            {imageBase64 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 240,
                  height: 240,
                  borderRadius: 16,
                  border: `1px solid ${line}`,
                  backgroundColor: "#ffffff",
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageBase64}
                  alt={productName}
                  width={240}
                  height={240}
                  style={{ objectFit: "cover" }}
                />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 240,
                  height: 240,
                  borderRadius: 16,
                  border: `1px solid ${line}`,
                  backgroundColor: "#f8f9fa",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    color: daisoRed,
                    fontSize: 44,
                    fontWeight: 900,
                    marginBottom: 8,
                  }}
                >
                  DAISO
                </div>
                <div
                  style={{
                    display: "flex",
                    color: muted,
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  상품 재고 확인
                </div>
              </div>
            )}
          </div>

          {/* 하단 푸터: 도메인 및 슬로건 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              paddingTop: 16,
              borderTop: `1px solid ${line}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 20,
                  fontWeight: 800,
                  color: ink,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: daisoRed,
                    display: "flex",
                    marginRight: 8,
                  }}
                />
                진열 위치 (층 · 구역 번호)
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 20,
                  fontWeight: 800,
                  color: ink,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: daisoRed,
                    display: "flex",
                    marginRight: 8,
                  }}
                />
                주변 매장 재고 비교
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 800,
                color: muted,
              }}
            >
              {footer}
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

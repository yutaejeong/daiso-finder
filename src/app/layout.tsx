import type { Metadata, Viewport } from "next";
// 한글은 글자가 많아 통째로 받으면 2MB 가 넘는다. 이 CSS 는 유니코드 구간별로 쪼갠
// 서브셋(@font-face + unicode-range)이라 화면에 나온 글자의 조각만 내려받는다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { GoogleAnalytics } from "./GoogleAnalytics";
import Provider from "./provider";
import { WebMCP } from "./webmcp";
import { branchSearchKeywords } from "@/lib/seoBranches";
import { buildSiteJsonLd } from "@/lib/jsonLd";
import { getBaseUrl } from "@/lib/site";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const APP_URL = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "다이소 상품 찾기 | 다이소 파인더",
    template: "%s | 다이소 파인더",
  },
  description: "다이소 매장의 상품 재고, 가격, 진열 위치를 확인하세요.",
  manifest: "/manifest.json",
  applicationName: "다이소 파인더",
  appleWebApp: {
    capable: true,
    title: "다이소 파인더",
    statusBarStyle: "default",
  },
  keywords: ["다이소", ...branchSearchKeywords],
  authors: [{ name: "다이소 파인더" }],
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "다이소 상품 찾기 | 다이소 파인더",
    description: "다이소 매장의 상품 재고, 가격, 진열 위치를 확인하세요.",
    siteName: "다이소 파인더",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "다이소 파인더 - 다이소 상품 찾기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "다이소 상품 찾기 | 다이소 파인더",
    description: "다이소 매장의 상품 재고, 가격, 진열 위치를 확인하세요.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png" },
      { url: "/apple-icon-180x180.png", sizes: "180x180" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 노치·홈 인디케이터 뒤까지 페이지를 확장하고, 안전 영역은 CSS 의
  // env(safe-area-inset-*) 로 직접 비운다(globals.css 의 --sat/--sab 등).
  // 이 값이 없으면 Safari 가 안전 영역 밖을 검은 띠나 다른 색으로 남긴다.
  viewportFit: "cover",
  // 주소창·상태바 색. globals.css 의 --bg 와 같은 값이어야 Safari 의 상단·하단
  // 바와 페이지 바탕이 한 장처럼 이어진다. 앱이 라이트 전용이라 하나만 둔다.
  themeColor: "#f6f6f8",
  colorScheme: "light",
  // 핀치 확대를 막지 않는다. 입력창이 16px 이상이라 iOS 의 포커스 자동 확대는
  // 일어나지 않으므로, 확대 금지는 접근성만 해치는 설정이었다.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildSiteJsonLd(APP_URL)),
          }}
        />
        <Provider>{children}</Provider>
        <WebMCP />
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}

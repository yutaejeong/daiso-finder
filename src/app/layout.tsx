import { css } from "@styled-system/css";
import clsx from "clsx";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GoogleAnalytics } from "./GoogleAnalytics";
import Provider from "./provider";
import { WebMCP } from "./webmcp";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const pretendard = localFont({
  src: "./PretendardVariable.woff2",
});

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "다이소 파인더",
  description:
    "다이소 매장의 상품 재고를 실시간으로 확인하세요. 내 주변 매장에 원하는 상품이 있는지 빠르게 찾아드립니다.",
  applicationCategory: "ShoppingApplication",
  operatingSystem: "All",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
  inLanguage: "ko-KR",
  audience: {
    "@type": "Audience",
    audienceType: "Korean shoppers",
    geographicArea: { "@type": "Country", name: "South Korea" },
  },
};

export const metadata: Metadata = {
  title: {
    default: "다이소 상품 찾기 | 다이소 파인더",
    template: "%s | 다이소 파인더",
  },
  description:
    "다이소 매장의 상품 재고를 실시간으로 확인하세요. 내 주변 매장에 원하는 상품이 있는지 빠르게 찾아드립니다.",
  manifest: "/manifest.json",
  applicationName: "다이소 파인더",
  keywords: [
    "다이소",
    "다이소 상품 찾기",
    "다이소 재고 확인",
    "다이소 매장 찾기",
    "다이소 위치",
    "다이소 재고",
  ],
  authors: [{ name: "다이소 파인더" }],
  formatDetection: { telephone: false },
  openGraph: {
    title: "다이소 상품 찾기 | 다이소 파인더",
    description:
      "다이소 매장의 상품 재고를 실시간으로 확인하세요. 내 주변 매장에 원하는 상품이 있는지 빠르게 찾아드립니다.",
    siteName: "다이소 파인더",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/ms-icon-310x310.png",
        width: 310,
        height: 310,
        alt: "다이소 파인더",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "다이소 상품 찾기 | 다이소 파인더",
    description:
      "다이소 매장의 상품 재고를 실시간으로 확인하세요.",
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
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ED1C24",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={clsx(
          pretendard.className,
          css({ padding: "24px !important", height: "100dvh" }),
        )}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />
        <Provider>{children}</Provider>
        <WebMCP />
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}

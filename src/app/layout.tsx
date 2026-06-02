import { css } from "@styled-system/css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GoogleAnalytics } from "./GoogleAnalytics";
import Provider from "./provider";
import { WebMCP } from "./webmcp";
import { branchSearchKeywords } from "@/lib/seoBranches";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://daiso-finder.kr"
).replace(/\/$/, "");

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${APP_URL}/#webapp`,
      name: "다이소 파인더",
      description: "다이소 매장의 상품 재고, 가격, 진열 위치를 확인하세요.",
      applicationCategory: "ShoppingApplication",
      operatingSystem: "All",
      offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      inLanguage: "ko-KR",
      audience: {
        "@type": "Audience",
        audienceType: "Korean shoppers",
        geographicArea: { "@type": "Country", name: "South Korea" },
      },
      keywords: branchSearchKeywords.join(", "),
    },
  ],
};

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
        className={css({ padding: "24px !important", height: "100dvh" })}
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

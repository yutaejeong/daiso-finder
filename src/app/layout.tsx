import { css } from "@styled-system/css";
import clsx from "clsx";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: "./PretendardVariable.woff2",
});

export const metadata: Metadata = {
  title: "다이소 상품 찾기",
  description: "간편하게 다이소 상품을 찾아보세요!",
  manifest: "/manifest.json",
  applicationName: "Daiso Finder",
  formatDetection: { telephone: false },
  themeColor: "#ED1C24",
  icons: {
    icon: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ED1C24" />
        <link rel="icon" href="/ms-icon-150x150.png" />
      </head>
      <body
        className={clsx(
          pretendard.className,
          css({ padding: "24px", height: "100dvh" }),
        )}
      >
        {children}
      </body>
    </html>
  );
}

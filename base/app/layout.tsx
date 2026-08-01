import type { Metadata, Viewport } from "next";
import { Barlow_Condensed } from "next/font/google";
import "./globals.css";

// 숫자·영문 라벨 전용. 한글 본문은 Pretendard(아래 CDN)가 받는다.
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BASE — 일단, 베이스부터.",
  description: "익명으로 묻고 대중에게 검증받는 남자 자기관리 커뮤니티",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f2f2f3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${barlowCondensed.variable} h-full`}>
      <head>
        {/* Pretendard는 구글 폰트에 없어서 CDN 서브셋을 쓴다(디자인 문서와 동일). */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

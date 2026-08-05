import type { Metadata, Viewport } from "next";
import { Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/pwa";
import { Splash } from "@/components/splash";
import { BRAND } from "@/lib/brand";

// 숫자·영문 라벨 전용. 한글 본문은 Pretendard(아래 CDN)가 받는다.
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: BRAND.name,
  description: "익명으로 묻고 대중에게 검증받는 남자 자기관리 커뮤니티",
  // 아이콘은 app/icon.svg 파일 규약이 자동으로 잡는다.
  appleWebApp: {
    // 홈 화면 아이콘 밑에 뜨는 이름. 고수 배포본은 여기서도 갈린다.
    title: BRAND.shortName,
    capable: true,
    // 반투명 상태바 — 배경이 상태바 뒤까지 이어져 앱처럼 보인다.
    statusBarStyle: "black-translucent",
  },
  // iOS는 매니페스트 아이콘을 안 읽는다. apple-touch-icon이 따로 있어야
  // 홈 화면에 제대로 뜨고, 없으면 화면을 캡처해서 쓴다.
  icons: { apple: BRAND.appleTouchIcon },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // 노치·홈 인디케이터 영역까지 화면을 쓴다. 이게 있어야 env(safe-area-*)가
  // 실제 값을 준다 — 없으면 항상 0이라 하단 탭바가 홈 인디케이터에 깔린다.
  viewportFit: "cover",
  themeColor: "#f6f3ef",
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
      <body className="min-h-full">
        <ServiceWorker />
        {/* 화면보다 위에 덮인다. 라우트마다 두지 않고 여기 한 번만 둔다 —
            화면을 옮길 때마다 다시 뜨면 그건 스플래시가 아니라 방해다. */}
        <Splash />
        {children}
      </body>
    </html>
  );
}

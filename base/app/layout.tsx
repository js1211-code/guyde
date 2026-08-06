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
    /**
     * 🚨 black-translucent로 되돌리지 말 것.
     *
     * 반투명 상태바가 보기에는 좋지만, 설치형 iOS에 오래된 버그가 있다.
     * 웹뷰를 화면 맨 위(y=0)에 붙여놓고 높이는 `화면 − 상태바`로 준다.
     * 즉 잘려나간 상태바 높이만큼이 **화면 아래쪽에** 남는다.
     * 그 영역은 웹뷰 바깥이라 CSS로 칠할 수도 없어서, 탭바 밑에 지울 수 없는
     * 빈 띠가 생긴다. 실제 기기에서 확인한 값:
     *   screen 852 · innerHeight 793 · 차이 59(= 상태바) · 셸 밑 빈 공간 0
     * (셸은 자기 영역을 꽉 채우고 있었다. 앱 영역 자체가 짧았다.)
     *
     * default는 OS가 상태바 자리를 알아서 비워두고 웹뷰를 그 아래에 놓는다.
     * 그러면 웹뷰가 화면 바닥까지 닿아서 탭바가 끝에 붙는다.
     * 상태바 밑으로 내용을 넣지 못하지만, 어차피 안전 영역만큼 패딩으로
     * 밀어내고 있었으므로 잃는 건 없다.
     *
     * ⚠️ iOS는 이 값을 **설치 시점에 기억한다.** 바꾸고 나면 홈 화면 아이콘을
     * 지웠다가 다시 추가해야 반영된다.
     */
    statusBarStyle: "default",
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
  /*
    상태바 자리 색. statusBarStyle이 default라 OS가 이 띠를 직접 칠하는데,
    앱 배경(종이색)을 쓰면 위쪽만 살짝 누런 띠처럼 보인다. 순백으로 둔다.

    ⚠️ manifest의 theme_color와 같은 값이어야 한다. 어긋나면 기기·브라우저마다
    다른 쪽을 읽어서 상태바 색이 왔다 갔다 한다.
  */
  themeColor: "#ffffff",
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

import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/**
 * PWA 매니페스트 — 홈 화면에 설치했을 때 앱처럼 열리게 한다.
 *
 * display: standalone 이라 주소창 없이 뜬다. 이 앱은 원래 390px 모바일 셸에
 * 하단 탭바를 둔 구조라 브라우저 UI가 빠지면 실제 앱과 거의 같아진다.
 *
 * 아이콘은 SVG가 아니라 PNG를 쓴다 — 안드로이드 런처와 iOS는 SVG를
 * 제대로 다루지 못하는 경우가 있다.
 * maskable을 따로 넣는 이유: 안드로이드가 아이콘을 원형·둥근사각형으로
 * 잘라내는데, any만 있으면 브랜드 타일 모서리가 잘려 나간다.
 *
 * 이름과 아이콘은 배포본마다 다르다(lib/brand.ts). 도메인이 다르면 설치
 * 신원도 달라서 홈 화면에 두 개가 나란히 생기는데, 겉모습이 같으면 어느
 * 쪽이 고수 버전인지 알 수가 없다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.shortName,
    description: "익명으로 묻고 대중에게 검증받는 남자 자기관리 커뮤니티",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f3ef",
    theme_color: "#f6f3ef",
    lang: "ko",
    icons: [
      { src: BRAND.icon192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: BRAND.icon512, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: BRAND.icon512, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

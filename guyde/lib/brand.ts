/**
 * 배포본마다 다른 겉모습 — 설치했을 때 두 앱이 구분되게 한다.
 *
 * 도메인이 다르면 iOS·안드로이드가 **이미 별개 앱으로** 취급해서 홈 화면에
 * 두 개가 나란히 생긴다(설치 신원은 origin + start_url 기준). 문제는 그
 * 둘의 아이콘과 이름이 똑같아서 어느 쪽이 고수 버전인지 알 수가 없다는 것뿐이다.
 *
 * 그래서 갈리는 건 아이콘 파일과 이름 두 가지고, 나머지 코드는 하나다.
 * NEXT_PUBLIC_DEMO_LABEL이 있으면 고수 배포본이다 — 화면 우상단 띠를 켜는
 * 값과 같은 걸 쓴다. 변수를 하나 더 만들면 한쪽만 켜놓고 헷갈리게 된다.
 *
 * ⚠️ NEXT_PUBLIC_ 은 빌드 시점에 박힌다. 값을 바꾸면 반드시 다시 배포해야 한다.
 */

const isExpertBuild = Boolean(process.env.NEXT_PUBLIC_DEMO_LABEL?.trim());

export const BRAND = {
  isExpertBuild,

  /** 홈 화면 아이콘 밑에 뜨는 이름. 짧아야 안 잘린다(iOS는 약 11자). */
  shortName: isExpertBuild ? "GUYDE 고수" : "GUYDE",

  name: isExpertBuild
    ? "GUYDE 고수 — GUY를 위한 GUIDE."
    : "GUYDE — GUY를 위한 GUIDE.",

  /**
   * 아이콘. 고수 배포본은 expert- 접두사가 붙은 파일을 쓴다.
   * 파일이 없으면 홈 화면 아이콘이 깨지므로 세 개를 항상 같이 둔다.
   */
  icon192: isExpertBuild ? "/icons/expert-icon-192.png" : "/icons/icon-192.png",
  icon512: isExpertBuild ? "/icons/expert-icon-512.png" : "/icons/icon-512.png",
  appleTouchIcon: isExpertBuild
    ? "/icons/expert-apple-touch-icon.png"
    : "/icons/apple-touch-icon.png",
} as const;

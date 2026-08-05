import { LogoMark } from "@/components/logo";

/**
 * 앱을 열면 잠깐 뜨는 로딩 화면.
 *
 * 왜 필요한가: 이 앱은 진입하자마자 기기를 등록하고(F-02) 피드를 받아온다.
 * 그동안 빈 화면이나 "불러오는 중…"이 먼저 보이는데, 설치형으로 열었을 때
 * 그게 첫인상이면 덜 만들어진 앱처럼 보인다.
 *
 * 🚨 **JS를 쓰지 않는다.** 타이머로 여닫으면 React가 붙은 뒤에야 화면을 덮기
 * 때문에, 그 전에 진짜 화면이 한 번 번쩍인다 — 가리려던 것을 오히려 보여주는
 * 꼴이다. HTML에 처음부터 들어 있고 CSS 애니메이션만으로 사라지면 첫 페인트
 * 부터 덮여 있다. 덤으로 자바스크립트가 느리거나 실패해도 스플래시가 화면에
 * 눌러앉지 않는다.
 *
 * 사라진 뒤에는 visibility:hidden + pointer-events:none 이라 클릭을 막지 않는다.
 *
 * 색은 앱 토큰을 쓴다 — 디자인 파일의 금색(#c9a86a)은 그 템플릿의 범용
 * 팔레트고, 우리 마크는 헤더에서 브라운으로 놓인다. 금색을 여기 쓰면
 * 고수 뱃지 색과 겹쳐서 "금색 = 고수"라는 뜻이 흐려진다.
 *
 * 화면 전환(클라이언트 라우팅)에서는 레이아웃이 다시 만들어지지 않으므로
 * 다시 뜨지 않는다. 앱을 새로 열 때만 보인다.
 */
export function Splash() {
  return (
    <div
      aria-hidden="true"
      // fixed inset-0 — 셸(max-w-430px)보다 위에 있어야 기기 화면을 꽉 채운다.
      // 안전 영역 여백을 주지 않는다: 노치 밑까지 같은 색으로 이어져야
      // 화면이 잘린 것처럼 보이지 않는다.
      className="splash fixed inset-0 z-[200] flex flex-col items-center justify-center bg-paper"
    >
      {/*
        크기를 화면에 맞춘다. 작은 기기(SE)에서 120px 고정이면 크고, 큰
        기기에서는 작다. vmin은 짧은 변 기준이라 어느 쪽이 모자라도 넘치지 않는다.
      */}
      <span className="splash-mark text-brand" style={{ width: "min(120px, 26vmin)" }}>
        {/* size는 viewBox만 정하고 실제 크기는 CSS가 잡는다(h-full w-full).
            획은 디자인의 스플래시처럼 조금 굵게 — 크게 놓으면 가는 획이 흐려 보인다. */}
        <LogoMark size={120} className="h-full w-full" strokeWidth={4.5} />
      </span>

      <span
        className="splash-word cond mt-6 leading-none font-bold tracking-[0.1em] text-ink"
        style={{ fontSize: "min(44px, 11vmin)" }}
      >
        GUYDE
      </span>

      <span className="mt-8 flex gap-2">
        <span className="splash-dot h-2 w-2 rounded-full bg-brand" />
        <span className="splash-dot h-2 w-2 rounded-full bg-brand" />
        <span className="splash-dot h-2 w-2 rounded-full bg-brand" />
      </span>
    </div>
  );
}

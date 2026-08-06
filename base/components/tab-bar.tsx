"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookIcon,
  BriefcaseIcon,
  MessageIcon,
  PlusIcon,
  UserIcon,
} from "@/components/icons";
import { useMe } from "@/lib/use-me";

/**
 * 하단 4탭.
 *
 * 고수도 일반 사용자와 똑같은 탭을 쓴다 — 커뮤니티에 글을 쓰고 도서관을 보는 건
 * 계정 종류와 상관없다. 다른 건 컨설팅 탭이 어디로 가느냐뿐이다.
 *   일반 → /experts    고수를 고르고 신청하는 화면
 *   고수 → /consulting 받은 신청함
 * 고수에게 신청 화면을 보여주면 자기 자신에게 신청하는 꼴이 된다.
 */
const TABS = [
  { key: "community", label: "커뮤니티", Icon: MessageIcon, href: "/" },
  { key: "library", label: "도서관", Icon: BookIcon, href: "/library" },
  { key: "consulting", label: "컨설팅", Icon: BriefcaseIcon, href: "/experts" },
  { key: "me", label: "내정보", Icon: UserIcon, href: "/me" },
] as const;

/** 컨설팅 탭이 맡는 경로들. 어느 쪽에 있든 그 탭이 켜져야 한다. */
const CONSULTING_PATHS = ["/experts", "/consulting", "/booking"];

function isActive(pathname: string, key: string) {
  if (key === "consulting") {
    return CONSULTING_PATHS.some((p) => pathname.startsWith(p));
  }
  if (key === "community") return pathname === "/" || pathname.startsWith("/post");
  if (key === "library") return pathname.startsWith("/library");
  return pathname.startsWith("/me");
}

/**
 * 마지막으로 표시된 탭 위치.
 *
 * 화면마다 <TabBar/>를 따로 그리기 때문에 라우팅할 때마다 탭바가 통째로
 * 새로 만들어진다. 그러면 인디케이터가 새 위치에 그냥 나타나고 전환이
 * 일어나지 않는다 — 실제로 transitionstart가 한 번도 발생하지 않았다.
 *
 * 모듈 스코프 변수는 리마운트를 넘어 살아남으므로, 새로 그릴 때 직전 위치에서
 * 출발시켜 목적지로 옮긴다. 라우팅 구조를 바꾸지 않고 슬라이드를 살리는 방법이다.
 * (새로고침하면 초기화되는데, 그때는 애니메이션 없이 제자리에서 시작하면 된다)
 */
let lastIndex = -1;

export function TabBar() {
  const pathname = usePathname();
  const { me } = useMe();

  const activeIndex = TABS.findIndex(({ key }) => isActive(pathname, key));
  // 처음 그릴 때는 직전 위치. 그 다음 프레임에 목적지로 옮기면 CSS가 미끄러뜨린다.
  const [slideTo, setSlideTo] = useState(lastIndex >= 0 ? lastIndex : activeIndex);

  useEffect(() => {
    lastIndex = slideTo;
  }, [slideTo]);

  useEffect(() => {
    if (slideTo === activeIndex) return;
    // rAF 두 번 — 한 번만 하면 출발 위치가 그려지기 전에 값이 바뀌어
    // 브라우저가 전환할 구간을 못 잡고 그냥 순간이동한다.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setSlideTo(activeIndex));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [activeIndex, slideTo]);

  return (
    <nav className="shrink-0 border-t border-neutral-400 bg-paper px-2 pt-2 pb-[max(0.25rem,var(--safe-bottom))]">
      {/*
        4등분 그리드여야 인디케이터를 index × 100%로 옮길 수 있다.
        justify-around은 간격이 균등하지 않아서 위치를 계산할 수 없다.
      */}
      <div className="relative grid grid-cols-4">
        {/*
          선택 표시가 탭 사이를 미끄러진다.
          left/width가 아니라 transform으로 옮긴다 — 레이아웃을 다시 계산하지
          않아서 저사양 기기에서도 끊기지 않는다.
        */}
        {slideTo >= 0 && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1/4 px-1.5 transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${slideTo * 100}%)` }}
          >
            <span className="block h-full rounded-xl bg-brand/10" />
          </span>
        )}

        {TABS.map(({ key, label, Icon, href }) => {
          const active = isActive(pathname, key);
          // 고수는 컨설팅 탭에서 받은 신청함으로 간다.
          const to = key === "consulting" && me?.is_expert ? "/consulting" : href;
          return (
            <Link
              key={key}
              href={to}
              aria-current={active ? "page" : undefined}
              // 누르면 즉시 눌린 티가 나야 한다. 화면 전환은 네트워크를 타서
              // 몇백 ms 걸리는데 그동안 반응이 없으면 안 눌린 줄 안다.
              className={`relative flex flex-col items-center gap-0.5 py-1 transition-transform duration-100 active:scale-90 ${
                active ? "text-brand" : "text-neutral-600"
              }`}
            >
              <Icon
                size={21}
                strokeWidth={active ? 1.8 : 1.5}
                className={`transition-colors duration-200 ${
                  active ? "text-brand" : "text-neutral-500"
                }`}
              />
              <span
                className={`text-[11px] transition-all duration-200 ${
                  active ? "font-bold" : "opacity-80"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * 글쓰기 FAB — 커뮤니티 탭에서만 보인다(F-17).
 *
 * 셸이 fixed로 화면에 붙어 있어서 이 absolute는 화면 기준이 된다.
 * (셸이 min-h-dvh였을 땐 문서 높이 기준이라, 글이 많으면 끝까지 스크롤해야
 *  버튼이 보였다. 셸 높이를 고정한 게 이 문제의 진짜 해결이다.)
 * bottom 값은 탭바 높이 + 여백. 탭바 위에 떠 있어야 한다.
 * ⚠️ 안전 영역을 더해야 한다 — 홈 인디케이터가 있는 기기는 탭바가 그만큼
 * 두꺼워지는데, 82px로 고정해두면 그 차이만큼 FAB이 탭바에 깔린다.
 */
export function WriteFab() {
  return (
    <Link
      href="/write"
      aria-label="글쓰기"
      className="absolute right-4 bottom-[calc(82px+var(--safe-bottom))] flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-brand text-white transition-transform duration-100 active:scale-90"
    >      <PlusIcon size={22} strokeWidth={1.8} />
    </Link>
  );
}

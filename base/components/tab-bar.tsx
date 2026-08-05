"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function TabBar() {
  const pathname = usePathname();
  const { me } = useMe();

  return (
    <nav className="flex shrink-0 items-end justify-around border-t border-neutral-400 bg-paper px-2 pt-2 pb-1">
      {TABS.map(({ key, label, Icon, href }) => {
        const active = isActive(pathname, key);
        // 고수는 컨설팅 탭에서 받은 신청함으로 간다.
        const to = key === "consulting" && me?.is_expert ? "/consulting" : href;
        return (
          <Link
            key={key}
            href={to}
            aria-current={active ? "page" : undefined}
            className={`flex w-14 flex-col items-center gap-0.5 ${
              active ? "text-brand" : "text-neutral-600"
            }`}
          >
            <Icon
              size={21}
              strokeWidth={active ? 1.8 : 1.5}
              className={active ? "text-brand" : "text-neutral-500"}
            />
            <span className={`text-[10px] ${active ? "font-bold" : ""}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * 글쓰기 FAB — 커뮤니티 탭에서만 보인다(F-17).
 *
 * 셸이 h-dvh로 고정돼 있어서 이 absolute는 화면 높이 기준이 된다.
 * (셸이 min-h-dvh였을 땐 문서 높이 기준이라, 글이 많으면 끝까지 스크롤해야
 *  버튼이 보였다. 셸 높이를 고정한 게 이 문제의 진짜 해결이다.)
 * bottom 값은 탭바 높이 + 여백. 탭바 위에 떠 있어야 한다.
 */
export function WriteFab() {
  return (
    <Link
      href="/write"
      aria-label="글쓰기"
      className="absolute right-4 bottom-[82px] flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-brand text-white"
    >      <PlusIcon size={22} strokeWidth={1.8} />
    </Link>
  );
}

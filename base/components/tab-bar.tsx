"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookIcon,
  BriefcaseIcon,
  HomeIcon,
  PlusIcon,
  UserIcon,
} from "@/components/icons";

const TABS = [
  { href: "/", label: "커뮤니티", Icon: HomeIcon },
  { href: "/library", label: "도서관", Icon: BookIcon },
  { href: "/experts", label: "컨설팅", Icon: BriefcaseIcon },
  { href: "/me", label: "내정보", Icon: UserIcon },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** 하단 4탭. 글쓰기는 탭이 아니라 FAB이다(F-05·F-17). */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 items-end justify-around border-t border-neutral-400 bg-paper px-2 pt-2 pb-1">
      {TABS.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
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

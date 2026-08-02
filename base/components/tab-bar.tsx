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
import { Reg } from "@/components/reg";

const TABS = [
  { href: "/", label: "커뮤니티", Icon: HomeIcon },
  { href: "/magazine", label: "매거진", Icon: BookIcon },
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
    <nav className="flex items-end justify-around border-t border-neutral-400 bg-paper px-2 pt-2 pb-1">
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
 * 탭바 위에 떠 있어야 해서 셸 기준 absolute로 띄운다.
 */
export function WriteFab() {
  return (
    <Link
      href="/write"
      aria-label="글쓰기"
      className="absolute right-4 bottom-[82px] flex h-[52px] w-[52px] items-center justify-center bg-brand text-white"
    >
      <Reg corners="tl tr bl br" className="!text-white" />
      <PlusIcon size={22} strokeWidth={1.8} />
    </Link>
  );
}

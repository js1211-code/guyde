"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardIcon,
  ConsultIcon,
  HomeIcon,
  PlusIcon,
  UserIcon,
} from "@/components/icons";

const TABS = [
  { href: "/", label: "홈", Icon: HomeIcon },
  { href: "/quiz", label: "유형테스트", Icon: ClipboardIcon },
  { href: "/experts", label: "컨설팅", Icon: ConsultIcon },
  { href: "/me", label: "마이", Icon: UserIcon },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** 하단 탭바. 가운데 글쓰기 버튼은 한 칸 띄워 올라간다. */
export function TabBar() {
  const pathname = usePathname();
  const [home, quiz, experts, me] = TABS;

  return (
    <nav className="flex items-end justify-around border-t border-neutral-400 bg-paper px-2 pt-2 pb-1">
      <Tab {...home} active={isActive(pathname, home.href)} />
      <Tab {...quiz} active={isActive(pathname, quiz.href)} />

      <Link
        href="/write"
        aria-label="질문 올리기"
        className="relative -mt-4 flex flex-col items-center"
      >
        <span className="flex h-11 w-11 items-center justify-center bg-accent text-white">
          <PlusIcon size={22} strokeWidth={1.8} />
        </span>
      </Link>

      <Tab {...experts} active={isActive(pathname, experts.href)} />
      <Tab {...me} active={isActive(pathname, me.href)} />
    </nav>
  );
}

function Tab({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof HomeIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex w-14 flex-col items-center gap-0.5 ${
        active ? "text-accent-700" : "text-neutral-600"
      }`}
    >
      <Icon
        size={21}
        strokeWidth={active ? 1.8 : 1.5}
        className={active ? "text-accent-700" : "text-neutral-500"}
      />
      <span className={`text-[10px] ${active ? "font-bold" : ""}`}>{label}</span>
    </Link>
  );
}

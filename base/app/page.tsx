"use client";

import Link from "next/link";
import { Feed } from "@/components/feed";
import { FirstRun } from "@/components/first-run";
import { SearchIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { AppShell, ScreenBody } from "@/components/shell";
import { TabBar, WriteFab } from "@/components/tab-bar";
import { useMe } from "@/lib/use-me";

export default function CommunityPage() {
  const { me, isFirstRun, dismissFirstRun, rerollNickname } = useMe();

  return (
    <AppShell>
      {/* 마크 + 워드마크만. 태그라인은 스플래시로 옮겼다 — 앱을 여는 순간
          한 번 읽히면 충분하고, 여기 달아두면 목록이 그만큼 아래로 밀린다.
          도서관 머리와 같은 모양이라 탭을 옮겨도 윗줄이 제자리에 있다. */}
      <header className="flex items-start justify-between px-4 pt-3 pb-2.5">
        <Logo size={24} />

        {/* 검색 입구. 도서관과 같은 자리다 — 글을 찾는 두 화면에만 둔다. */}
        <Link
          href="/search"
          aria-label="글 검색"
          className="-mr-1 p-1 text-neutral-700 transition-transform duration-100 active:scale-90"
        >
          <SearchIcon size={21} />
        </Link>
      </header>

      <ScreenBody>
        <Feed />
      </ScreenBody>

      <WriteFab />
      <TabBar />

      {isFirstRun && me && (
        <FirstRun
          nickname={me.nickname}
          onReroll={rerollNickname}
          onStart={dismissFirstRun}
        />
      )}
    </AppShell>
  );
}

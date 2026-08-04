"use client";

import Link from "next/link";
import { Feed } from "@/components/feed";
import { FirstRun } from "@/components/first-run";
import { HeartIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { AppShell, ScreenBody } from "@/components/shell";
import { TabBar, WriteFab } from "@/components/tab-bar";
import { useMe } from "@/lib/use-me";

export default function CommunityPage() {
  const { me, isFirstRun, dismissFirstRun, rerollNickname } = useMe();

  return (
    <AppShell>
      <header className="flex items-center justify-between px-4 pt-3 pb-2.5">
        <div>
          {/* 마크 + 워드마크. 예전엔 GUYDE+ 였는데 '+'는 로고가 정해지기 전
              임시 강조였다. 이제 마크가 그 자리를 대신한다. */}
          <Logo size={24} />
          <p className="mt-1 text-[10px] tracking-wide text-neutral-600">
            GUY를 위한 GUIDE.
          </p>
        </div>
        {/* 하트를 누르면 충전 샵으로 */}
        <Link
          href="/hearts"
          aria-label="하트 충전"
          className="flex items-center gap-1.5 rounded-xl border border-neutral-400 px-2 py-1"
        >
          <HeartIcon size={14} className="text-brand" />
          <span className="cond text-[15px] leading-none font-bold text-brand">
            {me?.hearts ?? "–"}
          </span>
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

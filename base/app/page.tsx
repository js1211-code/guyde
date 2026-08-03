"use client";

import Link from "next/link";
import { Feed } from "@/components/feed";
import { FirstRun } from "@/components/first-run";
import { HeartIcon } from "@/components/icons";
import { AppShell, ScreenBody } from "@/components/shell";
import { TabBar, WriteFab } from "@/components/tab-bar";
import { useMe } from "@/lib/use-me";

export default function CommunityPage() {
  const { me, isFirstRun, dismissFirstRun, rerollNickname } = useMe();

  return (
    <AppShell>
      <header className="flex items-center justify-between px-4 pt-3 pb-2.5">
        <div>
          <p className="cond text-[24px] leading-none font-bold tracking-[0.14em]">
            BASE<span className="text-brand">+</span>
          </p>
          <p className="mt-0.5 text-[10px] tracking-wide text-neutral-600">
            일단, 베이스부터.
          </p>
        </div>
        {/* 하트를 누르면 충전 샵으로 */}
        <Link
          href="/hearts"
          aria-label="하트 충전"
          className="flex items-center gap-1.5 border border-neutral-400 px-2 py-1"
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

"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRightIcon, HeartIcon, LockIcon, PencilIcon } from "@/components/icons";
import { Reg } from "@/components/reg";
import { AppShell, PageTitle, ScreenBody } from "@/components/shell";
import { TabBar } from "@/components/tab-bar";
import { Temperature, TemperatureProgress } from "@/components/temperature";
import { TEMP_EXPERT_GATE } from "@/lib/constants";
import { useMe } from "@/lib/use-me";

const MENU = [
  { label: "내 글", href: "/me/activity" },
  { label: "내 댓글", href: "/me/activity?tab=comments" },
  { label: "내 예약", href: "/me/bookings" },
];

/** ⑱ 내정보 */
export default function MePage() {
  const { me, renameNickname } = useMe();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const qualified = (me?.temperature ?? 0) >= TEMP_EXPERT_GATE;

  async function save() {
    try {
      await renameNickname(draft);
      setEditing(false);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error && e.message === "NICKNAME_TAKEN"
          ? "이미 있는 닉네임이에요"
          : "바꾸지 못했어요",
      );
    }
  }

  return (
    <AppShell>
      <PageTitle>내정보</PageTitle>

      <ScreenBody className="px-4">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 rounded-md border border-neutral-400 px-3 py-2 text-[15px] font-bold"
              autoFocus
            />
            <button
              type="button"
              onClick={save}
              className="cond text-[13px] font-bold text-brand"
            >
              저장
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[18px] font-bold">{me?.nickname ?? "…"}</span>
            <button
              type="button"
              aria-label="닉네임 변경"
              onClick={() => {
                setDraft(me?.nickname ?? "");
                setEditing(true);
              }}
            >
              <PencilIcon size={16} className="text-neutral-500" />
            </button>
          </div>
        )}
        {error && <p className="mt-1 text-[12px] text-temp">{error}</p>}

        <div className="mt-1.5">
          <Temperature value={me?.temperature ?? 36.5} size={24} />
        </div>

        <TemperatureProgress value={me?.temperature ?? 36.5} />

        {/* 자격이 희소하다는 신호가 목적이라 잠긴 상태로도 노출한다 (F-72) */}
        <div
          className={`mt-4 flex items-center justify-center gap-2 border py-3 ${
            qualified
              ? "border-brand bg-brand-tint"
              : "border-neutral-300 bg-neutral-200 opacity-55"
          }`}
        >
          {!qualified && <LockIcon size={16} className="text-neutral-600" />}
          <span
            className={`text-[14px] font-bold ${
              qualified ? "text-brand-dark" : "text-neutral-600"
            }`}
          >
            고수 개설하기
          </span>
        </div>

        <div className="relative mt-4 flex items-center justify-between rounded-xl border border-neutral-400 p-3.5">
          <Reg corners="tl br" />
          <span className="flex items-center gap-1.5">
            <HeartIcon size={16} className="text-brand" />
            <span className="text-[13.5px] font-semibold">보유 하트</span>
          </span>
          <span className="cond text-[16px] font-bold text-brand">
            {me?.hearts ?? "–"}개
          </span>
        </div>

        <nav className="mt-5">
          {MENU.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between py-3 ${
                i === 0
                  ? "border-t border-neutral-400"
                  : "border-t border-dashed border-neutral-400"
              } ${i === MENU.length - 1 ? "border-b border-neutral-400" : ""}`}
            >
              <span className="text-[14px] font-medium">{item.label}</span>
              <ChevronRightIcon size={16} className="text-neutral-500" />
            </Link>
          ))}
        </nav>
      </ScreenBody>

      <TabBar />
    </AppShell>
  );
}

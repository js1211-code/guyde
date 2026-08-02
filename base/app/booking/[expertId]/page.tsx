"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { PhotoSlot } from "@/components/badge";
import { CheckIcon } from "@/components/icons";
import {
  AppShell,
  BottomBar,
  PrimaryButton,
  ScreenBody,
  TopBar,
} from "@/components/shell";
import { getExpert, getSlots } from "@/lib/mock";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
/** 2026년 8월: 1일이 토요일 → 앞에 빈칸 6개 */
const AUG_2026_OFFSET = 6;
const AUG_2026_DAYS = 31;

/**
 * ⑯ 예약 신청.
 * 고수가 열어둔 슬롯만 활성화되고 나머지는 비활성으로 보인다(F-56).
 * 결제는 붙이지 않는다 — 안내 문구만(F-59).
 */
export default function BookingPage({
  params,
}: {
  params: Promise<{ expertId: string }>;
}) {
  const { expertId } = use(params);
  const router = useRouter();
  const expert = getExpert(expertId);
  const slots = getSlots(expertId);

  const [day, setDay] = useState<number | null>(slots[0]?.day ?? null);
  const [time, setTime] = useState<string | null>(null);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [memo, setMemo] = useState("");

  if (!expert) {
    return (
      <AppShell>
        <TopBar backHref="/experts" title="예약 신청" />
        <p className="px-4 py-16 text-center text-[13px] text-neutral-600">
          없는 고수예요
        </p>
      </AppShell>
    );
  }

  const openDays = new Set(slots.map((s) => s.day));
  const timesForDay = slots.find((s) => s.day === day)?.times ?? [];
  const ready = day !== null && time !== null;

  return (
    <AppShell>
      <TopBar backHref={`/experts/${expertId}`} title="예약 신청" />

      <ScreenBody className="px-4 pt-3">
        <p className="mb-2 text-[13px] font-bold">날짜 선택 · 2026년 8월</p>
        <div className="grid grid-cols-7 gap-1 text-center text-[12px] text-neutral-500">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1">
          {Array.from({ length: AUG_2026_OFFSET }, (_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: AUG_2026_DAYS }, (_, i) => i + 1).map((d) => {
            const open = openDays.has(d);
            const selected = day === d;
            return (
              <button
                key={d}
                type="button"
                disabled={!open}
                onClick={() => {
                  setDay(d);
                  setTime(null);
                }}
                className={`flex h-8 items-center justify-center text-[12.5px] ${
                  selected
                    ? "bg-brand font-bold text-white"
                    : open
                      ? "border border-brand font-bold text-brand"
                      : "text-neutral-300"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>

        {day !== null && (
          <>
            <p className="mt-4 mb-2 text-[13px] font-bold">
              8월 {day}일({WEEKDAYS[(AUG_2026_OFFSET + day - 1) % 7]}) 시간 선택
            </p>
            <div className="flex flex-wrap gap-2">
              {timesForDay.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={`px-3 py-1.5 text-[13px] font-bold ${
                    time === t
                      ? "bg-brand text-white"
                      : "border border-brand text-brand"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="mt-5 mb-2 text-[13px] font-bold">고민 항목 (복수 선택)</p>
        <div className="flex flex-col gap-2">
          {expert.concerns.map((c) => {
            const on = concerns.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() =>
                  setConcerns((prev) =>
                    on ? prev.filter((x) => x !== c) : [...prev, c],
                  )
                }
                className="flex items-center gap-2 text-left"
              >
                <span
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center ${
                    on ? "bg-brand" : "border border-neutral-400"
                  }`}
                >
                  {on && <CheckIcon size={12} strokeWidth={2.5} className="text-white" />}
                </span>
                <span className="text-[13.5px]">{c}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-5 mb-2 text-[13px] font-bold">자유 메모</p>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="상담 전 고민을 자유롭게 적어주세요"
          className="min-h-[60px] w-full resize-none border border-neutral-400 px-3 py-2.5 text-[13.5px]"
        />

        <p className="mt-4 mb-2 text-[13px] font-bold">사진 첨부 (선택)</p>
        <PhotoSlot />

        <p className="mt-5 mb-2 text-[12px] text-neutral-600">
          상담료 {expert.price_chat.toLocaleString("ko-KR")}원 · 결제는 준비 중입니다
        </p>
      </ScreenBody>

      <BottomBar>
        <PrimaryButton
          disabled={!ready}
          onClick={() => router.push(`/booking/done/${expertId}`)}
        >
          예약 신청
        </PrimaryButton>
      </BottomBar>
    </AppShell>
  );
}

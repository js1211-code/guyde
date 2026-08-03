"use client";

import { useState } from "react";
import { CategoryBadge } from "@/components/badge";
import { BottomBar, PrimaryButton, ScreenBody } from "@/components/shell";
import { Temperature } from "@/components/temperature";

export type ServiceFormat = "chat" | "video";

export const SERVICE_LABEL: Record<ServiceFormat, string> = {
  chat: "비동기 채팅",
  video: "화상 상담",
};

/**
 * ⑮ 고수 프로필의 상담 형식 선택 + 예약 CTA.
 *
 * 형식을 고르지 않으면 예약을 넣을 수 없다 — 가격도 고민 항목도 형식에 따라
 * 달라지기 때문에 뒤 화면에서 되물으면 흐름이 끊긴다.
 * 카드와 CTA가 화면 위아래로 떨어져 있어서 그 사이 섹션을 children으로 받는다.
 */
export function ExpertBooking({
  expertId,
  nickname,
  temperature,
  specialty,
  intro,
  priceChat,
  priceVideo,
  children,
}: {
  expertId: string;
  nickname: string;
  temperature: number;
  specialty: string;
  intro: string;
  priceChat: number;
  priceVideo: number;
  children: React.ReactNode;
}) {
  const [format, setFormat] = useState<ServiceFormat | null>(null);

  const services: { key: ServiceFormat; price: number }[] = [
    { key: "chat", price: priceChat },
    { key: "video", price: priceVideo },
  ];

  return (
    <>
      <ScreenBody>
        <section className="border-b-8 border-neutral-200 px-4 pt-4 pb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[17px] font-bold">{nickname}</span>
            <Temperature value={temperature} size={13} />
          </div>
          <span className="mt-1.5 inline-block">
            <CategoryBadge>{specialty}</CategoryBadge>
          </span>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-700">
            {intro}
          </p>

          <div className="mt-3 flex gap-2">
            {services.map((s) => {
              const on = format === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setFormat(s.key)}
                  aria-pressed={on}
                  className={`flex-1 border p-2.5 text-left ${
                    on ? "border-brand bg-brand/15" : "border-neutral-400"
                  }`}
                >
                  <span
                    className={`block text-[12px] ${
                      on ? "font-semibold text-brand-dark" : "text-neutral-600"
                    }`}
                  >
                    {SERVICE_LABEL[s.key]}
                  </span>
                  <span className="cond block text-[16px] font-bold text-brand">
                    ₩{s.price.toLocaleString("ko-KR")}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11.5px] text-neutral-600">
            {format
              ? `${SERVICE_LABEL[format]}으로 신청해요`
              : "상담 형식을 골라주세요"}
          </p>
        </section>

        {children}
      </ScreenBody>

      <BottomBar>
        <PrimaryButton
          disabled={!format}
          href={format ? `/booking/${expertId}?format=${format}` : undefined}
        >
          예약 신청하기
        </PrimaryButton>
      </BottomBar>
    </>
  );
}

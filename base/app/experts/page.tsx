"use client";

import Link from "next/link";
import { useState } from "react";
import { CategoryBadge, Chip } from "@/components/badge";
import { StarIcon } from "@/components/icons";
import { Reg } from "@/components/reg";
import { AppShell, NoticeBar, PageTitle, ScreenBody } from "@/components/shell";
import { TabBar } from "@/components/tab-bar";
import { Temperature } from "@/components/temperature";
import { EXPERT_TOP_PERCENT, TEMP_CATEGORIES } from "@/lib/constants";
import { getExperts } from "@/lib/mock";

/**
 * ⑭ 고수 목록.
 * 전문분야는 3개뿐이다 — '자유'는 온도가 쌓이지 않는 카테고리라 제외(F-51).
 */
export default function ExpertsPage() {
  const [specialty, setSpecialty] = useState<string>(TEMP_CATEGORIES[0]);
  const experts = getExperts(specialty);

  return (
    <AppShell>
      <PageTitle>고수</PageTitle>
      <NoticeBar>
        온도 상위 {EXPERT_TOP_PERCENT}%만 고수가 될 수 있어요
      </NoticeBar>

      <div className="flex gap-2 px-4 py-2.5">
        {TEMP_CATEGORIES.map((c) => (
          <Chip key={c} selected={specialty === c} onClick={() => setSpecialty(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <ScreenBody className="px-4">
        {experts.map((e) => (
          <Link
            key={e.id}
            href={`/experts/${e.id}`}
            className="relative mb-3 block border border-neutral-400 p-3.5"
          >
            <Reg corners="tl br" />
            <div className="flex items-center gap-1.5">
              <span className="text-[14.5px] font-bold">{e.nickname}</span>
              <Temperature value={e.temperature} size={12} />
              <span className="ml-auto">
                <CategoryBadge>{e.specialty}</CategoryBadge>
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-700">
              {e.intro}
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="cond text-[13px] font-bold text-brand">
                ₩{e.price_chat.toLocaleString("ko-KR")}부터
              </span>
              <span className="flex items-center gap-1 text-[12.5px] font-semibold">
                <StarIcon />
                {e.rating.toFixed(1)}
              </span>
            </div>
          </Link>
        ))}
        {experts.length === 0 && (
          <p className="py-10 text-center text-[13px] text-neutral-600">
            이 분야에는 아직 고수가 없어요
          </p>
        )}
      </ScreenBody>

      <TabBar />
    </AppShell>
  );
}

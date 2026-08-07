"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowUpRightIcon, StarIcon } from "@/components/icons";
import {
  AppShell,
  BottomBar,
  Kicker,
  PrimaryButton,
  ScreenBody,
  TopBar,
} from "@/components/shell";
import { Temperature } from "@/components/temperature";
import { CONSULTING_SLA_HOURS } from "@/lib/constants";
import { fetchExpert, type ExpertDetail } from "@/lib/api/consulting-client";

/**
 * ⑮ 고수 프로필.
 * 핵심은 "커뮤니티 대표 답변 3개"다(F-55) — 실제로 단 댓글을 추천순으로
 * 인용하고 원본 글로 잇는다. 이게 없으면 크몽·숨고와 구분되지 않는다.
 *
 * v2에선 채팅/화상 중 무엇을 고르느냐에 따라 가격과 CTA가 바뀌어서
 * 상담 방식 상태를 들고 있었다. v3는 방식 선택이 없고 단일가라 고를 게 없다.
 */
export default function ExpertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [expert, setExpert] = useState<ExpertDetail | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchExpert(id)
      .then(setExpert)
      .catch(() => setFailed(true));
  }, [id]);

  if (failed) {
    return (
      <AppShell>
        <TopBar backHref="/experts" title="고수" />
        <ScreenBody className="px-4 pt-10">
          <p className="text-center text-[14px] text-neutral-600">
            고수를 찾을 수 없어요
          </p>
        </ScreenBody>
      </AppShell>
    );
  }

  if (!expert) {
    return (
      <AppShell>
        <TopBar backHref="/experts" />
        <ScreenBody className="px-4 pt-10">
          <p className="text-center text-[14px] text-neutral-500">불러오는 중…</p>
        </ScreenBody>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar backHref="/experts" />

      <ScreenBody>
        <section className="px-4 pt-2 pb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-[20.5px] font-bold">{expert.nickname}</h1>
            <Temperature value={expert.temperature} size={15} />
          </div>
          <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-700">
            {expert.intro}
          </p>
          <div className="mt-3 flex items-center gap-3 text-[13.5px] text-neutral-600">
            {expert.rating !== null && (
              <span className="flex items-center gap-1 font-semibold text-ink">
                <StarIcon />
                {expert.rating.toFixed(1)}
              </span>
            )}
            <span>커뮤니티 답변 {expert.answered_count}건</span>
          </div>
        </section>

        {expert.highlights.length > 0 && (
          <section className="border-b-8 border-neutral-200 px-4 pt-4 pb-4">
            <p className="cond mb-3 text-[14px] font-semibold tracking-wide text-brand">
              커뮤니티 대표 답변 {expert.highlights.length}개
            </p>
            {expert.highlights.map((h) => (
              <Link
                key={h.post_id + h.body.slice(0, 8)}
                href={`/post/${h.post_id}`}
                className="mb-2.5 block rounded-lg border border-brand-tint-b bg-brand-tint p-3 last:mb-0"
              >
                <p className="text-[15px] leading-relaxed">“{h.body}”</p>
                <span className="mt-2 flex items-center justify-between">
                  <span className="text-[12.5px] text-neutral-600">
                    {h.post_title}
                    {h.likes > 0 && ` · 추천 ${h.likes}`}
                  </span>
                  <ArrowUpRightIcon size={15} className="text-brand-dark" />
                </span>
              </Link>
            ))}
          </section>
        )}

        {expert.reviews.length > 0 && (
          <section className="px-4 pt-4 pb-4">
            <Kicker className="mb-2">REVIEWS</Kicker>
            {expert.reviews.map((r, i) => (
              <div
                key={i}
                className="border-t border-dashed border-neutral-400 py-2"
              >
                <span className="cond text-[13.5px] font-semibold text-brand">
                  {"★".repeat(r.rating)}
                </span>
                <p className="mt-1 text-[14.5px]">{r.body}</p>
              </div>
            ))}
          </section>
        )}
      </ScreenBody>

      <BottomBar>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[13.5px] text-neutral-600">컨설팅비</span>
          <span className="cond text-[20.5px] font-bold">
            ₩{expert.price.toLocaleString("ko-KR")}
          </span>
        </div>
        <PrimaryButton href={`/booking/${expert.id}`}>
          컨설팅 신청하기
        </PrimaryButton>
        <p className="mt-2 text-center text-[12.5px] text-neutral-500">
          {CONSULTING_SLA_HOURS}시간 안에 답변 · 불만족 시 100% 환불
        </p>
      </BottomBar>
    </AppShell>
  );
}

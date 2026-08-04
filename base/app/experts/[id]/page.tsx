import Link from "next/link";
import { notFound } from "next/navigation";
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
import { CONSULTING_SLA_HOURS, getExpert, getExpertIds } from "@/lib/mock";

export function generateStaticParams() {
  return getExpertIds().map((id) => ({ id }));
}

/**
 * ⑮ 고수 프로필.
 * 이 화면의 핵심은 "커뮤니티 대표 답변 3개"다(F-55) — 실제로 단 댓글을 인용하고
 * 원본 글로 이어진다. 이게 없으면 크몽·숨고와 구분되지 않는다.
 *
 * v2에선 채팅/화상 중 무엇을 고르느냐에 따라 가격과 CTA가 바뀌어서
 * 클라이언트 컴포넌트(ExpertBooking)로 상태를 들고 있었다.
 * v3는 방식 선택이 없고 단일가라 고를 게 없다 — 전부 서버에서 그린다.
 */
export default async function ExpertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expert = getExpert(id);
  if (!expert) notFound();

  return (
    <AppShell>
      <TopBar backHref="/experts" />

      <ScreenBody>
        <section className="px-4 pt-2 pb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-[19px] font-bold">{expert.nickname}</h1>
            <Temperature value={expert.temperature} size={15} />
          </div>
          <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-700">
            {expert.intro}
          </p>
          <div className="mt-3 flex items-center gap-3 text-[12.5px] text-neutral-600">
            <span className="flex items-center gap-1 font-semibold text-ink">
              <StarIcon />
              {expert.rating.toFixed(1)}
            </span>
            <span>답변 {expert.answered_count}건</span>
          </div>
        </section>

        <section className="border-b-8 border-neutral-200 px-4 pt-4 pb-4">
          <p className="cond mb-3 text-[13px] font-semibold tracking-wide text-brand">
            커뮤니티 대표 답변 3개
          </p>
          {expert.highlights.map((h) => (
            <Link
              key={h.post_id}
              href={`/post/${h.post_id}`}
              className="mb-2.5 block rounded-lg border border-brand-tint-b bg-brand-tint p-3 last:mb-0"
            >
              <p className="text-[14px] leading-relaxed">“{h.body}”</p>
              <span className="mt-2 flex items-center justify-between">
                <span className="text-[11.5px] text-neutral-600">
                  {h.post_title}
                </span>
                <ArrowUpRightIcon size={15} className="text-brand-dark" />
              </span>
            </Link>
          ))}
        </section>

        <section className="px-4 pt-4 pb-4">
          <Kicker className="mb-2">REVIEWS</Kicker>
          {expert.reviews.map((r, i) => (
            <div key={i} className="border-t border-dashed border-neutral-400 py-2">
              <span className="cond text-[12.5px] font-semibold text-brand">
                {"★".repeat(r.rating)}
              </span>
              <p className="mt-1 text-[13.5px]">{r.body}</p>
            </div>
          ))}
        </section>
      </ScreenBody>

      <BottomBar>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[12.5px] text-neutral-600">컨설팅비</span>
          <span className="cond text-[19px] font-bold">
            ₩{expert.price.toLocaleString("ko-KR")}
          </span>
        </div>
        <PrimaryButton href={`/booking/${expert.id}`}>
          컨설팅 신청하기
        </PrimaryButton>
        <p className="mt-2 text-center text-[11.5px] text-neutral-500">
          {CONSULTING_SLA_HOURS}시간 안에 답변 · 불만족 시 100% 환불
        </p>
      </BottomBar>
    </AppShell>
  );
}

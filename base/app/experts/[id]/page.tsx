import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryBadge } from "@/components/badge";
import { ArrowUpRightIcon } from "@/components/icons";
import {
  AppShell,
  BottomBar,
  Kicker,
  PrimaryButton,
  ScreenBody,
  TopBar,
} from "@/components/shell";
import { Temperature } from "@/components/temperature";
import { getExpert, getExpertIds } from "@/lib/mock";

export function generateStaticParams() {
  return getExpertIds().map((id) => ({ id }));
}

/**
 * ⑮ 고수 프로필.
 * 이 화면의 핵심은 "커뮤니티 대표 답변 3개"다(F-55) — 실제로 단 댓글을 인용하고
 * 원본 글로 이어진다. 이게 없으면 크몽·숨고와 구분되지 않는다.
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
        <section className="border-b-8 border-neutral-200 px-4 pt-4 pb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[17px] font-bold">{expert.nickname}</span>
            <Temperature value={expert.temperature} size={13} />
          </div>
          <span className="mt-1.5 inline-block">
            <CategoryBadge>{expert.specialty}</CategoryBadge>
          </span>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-700">
            {expert.intro}
          </p>

          <div className="mt-3 flex gap-2">
            {[
              { label: "비동기 채팅", price: expert.price_chat },
              { label: "화상 상담", price: expert.price_video },
            ].map((s) => (
              <div key={s.label} className="flex-1 border border-neutral-400 p-2.5">
                <p className="text-[12px] text-neutral-600">{s.label}</p>
                <p className="cond text-[16px] font-bold text-brand">
                  ₩{s.price.toLocaleString("ko-KR")}
                </p>
              </div>
            ))}
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
              className="mb-2.5 block border border-brand-tint-b bg-brand-tint p-3 last:mb-0"
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
        <PrimaryButton href={`/booking/${expert.id}`}>예약 신청하기</PrimaryButton>
      </BottomBar>
    </AppShell>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRightIcon } from "@/components/icons";
import { ExpertBooking } from "@/components/expert-booking";
import { AppShell, Kicker, TopBar } from "@/components/shell";
import { getExpert, getExpertIds } from "@/lib/mock";

export function generateStaticParams() {
  return getExpertIds().map((id) => ({ id }));
}

/**
 * ⑮ 고수 프로필.
 * 이 화면의 핵심은 "커뮤니티 대표 답변 3개"다(F-55) — 실제로 단 댓글을 인용하고
 * 원본 글로 이어진다. 이게 없으면 크몽·숨고와 구분되지 않는다.
 *
 * 프로필 헤더·상담 형식 선택·예약 CTA는 상태를 공유해야 해서 ExpertBooking이 맡고,
 * 무거운 인용·후기 섹션은 서버에서 그린 채로 children으로 넘긴다.
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

      <ExpertBooking
        expertId={expert.id}
        nickname={expert.nickname}
        temperature={expert.temperature}
        specialty={expert.specialty}
        intro={expert.intro}
        priceChat={expert.price_chat}
        priceVideo={expert.price_video}
      >
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
      </ExpertBooking>
    </AppShell>
  );
}

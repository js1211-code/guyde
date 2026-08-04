"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import {
  AnswerView,
  ConsultStepper,
  StatusPill,
} from "@/components/consulting";
import { CheckIcon } from "@/components/icons";
import {
  AppShell,
  BottomBar,
  PrimaryButton,
  ScreenBody,
  TopBar,
} from "@/components/shell";
import { Temperature } from "@/components/temperature";
import {
  CONSULTING_SLA_HOURS,
  type Booking,
  getBooking,
  latestAnswer,
} from "@/lib/mock";

/**
 * ⑰㉒㉕㉖㉗ 컨설팅 상세 — 한 화면이 status에 따라 다섯 얼굴을 한다.
 *
 * 화면을 상태별로 쪼개지 않은 이유: 머리(고수·설문 요약)와 스테퍼가 전부 같고
 * 달라지는 건 본문과 하단 액션뿐이다. 쪼개면 같은 헤더를 다섯 번 고쳐야 한다.
 *
 *   신청 접수   → 아직 답변 없음. SLA 안내만.
 *   답변 도착   → 답변 전문 + [이대로 좋아요] / [수정을 요청해요]
 *   수정 요청됨 → 사유를 보여주고 고수 작업을 기다린다
 *   완료        → 확정안 + 후기
 */
export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const booking = getBooking(id);
  const router = useRouter();
  // 데모라 서버에 보내지 않고 화면 안에서만 상태를 넘긴다.
  const [accepted, setAccepted] = useState(false);

  if (!booking) {
    return (
      <AppShell>
        <TopBar backHref="/me/bookings" title="컨설팅" />
        <ScreenBody className="px-4 pt-10">
          <p className="text-center text-[13px] text-neutral-600">
            컨설팅을 찾을 수 없어요
          </p>
        </ScreenBody>
      </AppShell>
    );
  }

  const status = accepted ? "완료" : booking.status;
  const answer = latestAnswer(booking);

  return (
    <AppShell>
      <TopBar backHref="/me/bookings" title="내 컨설팅" />

      <ScreenBody className="pb-2">
        <section className="px-4 pt-3 pb-4">
          <ConsultStepper status={status} />
        </section>

        <SurveySummary booking={booking} status={status} />

        {status === "신청 접수" && (
          <section className="px-4 pt-5 text-center">
            <p className="text-[16px] font-bold">신청이 접수됐어요</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600">
              {CONSULTING_SLA_HOURS}시간 안에 1회차 답변이 도착해요
              <br />
              <span className="cond font-bold text-brand">
                {booking.due_label}
              </span>
            </p>
          </section>
        )}

        {status === "수정 요청됨" && (
          <section className="mx-4 mt-4 rounded-2xl bg-danger-tint p-4">
            <p className="text-[13px] font-bold text-danger">
              수정을 요청했어요
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-700">
              “{booking.revision_reason}”
            </p>
            <p className="mt-2 text-[11.5px] text-neutral-500">
              고수가 확정안을 다시 만드는 중이에요 · 수정 요청은 1회 가능해요
            </p>
          </section>
        )}

        {answer && (
          <section className="px-4 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="cond text-[13px] font-semibold tracking-wide text-neutral-600">
                {answer.round}회차 {answer.round === 2 ? "확정안" : "답변"}
              </p>
              {booking.answers.length > 1 && (
                <span className="text-[11.5px] text-neutral-500">
                  총 {booking.answers.length}회차
                </span>
              )}
            </div>
            <AnswerView answer={answer} budgetMax={booking.budget_max} />
          </section>
        )}

        {status === "완료" && booking.review && (
          <section className="mx-4 mb-4 rounded-2xl bg-ok-tint p-4">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-ok">
              <CheckIcon size={14} />
              컨설팅이 끝났어요
            </p>
            <p className="cond mt-2 text-[13px] font-semibold text-brand">
              {"★".repeat(booking.review.rating)}
            </p>
            <p className="mt-1 text-[13px]">{booking.review.body}</p>
          </section>
        )}

        {status === "완료" && !booking.review && (
          <section className="px-4 pb-4">
            <PrimaryButton href={`/booking/done/${booking.id}`}>
              후기 남기기
            </PrimaryButton>
          </section>
        )}
      </ScreenBody>

      {status === "답변 도착" && (
        <BottomBar>
          <p className="mb-2 text-center text-[12px] text-neutral-600">
            이 답변으로 확정할까요?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/booking/done/${booking.id}/revise`)}
              className="flex-1 rounded-md border border-neutral-300 py-3.5 text-[14px] font-semibold text-neutral-700"
            >
              수정을 요청해요
            </button>
            <button
              type="button"
              onClick={() => setAccepted(true)}
              className="flex-1 rounded-md bg-brand py-3.5 text-[14px] font-bold text-white"
            >
              이대로 좋아요
            </button>
          </div>
          <p className="mt-2 text-center text-[11.5px] text-neutral-500">
            수정 요청은 1회 가능해요 · 불만족 시 100% 환불
          </p>
        </BottomBar>
      )}

      {status === "신청 접수" && (
        <BottomBar>
          <Link
            href="/me/bookings"
            className="cond block w-full rounded-md bg-brand py-3.5 text-center text-[15px] font-bold text-white"
          >
            내 컨설팅 보기
          </Link>
        </BottomBar>
      )}
    </AppShell>
  );
}

/** 고수 + 설문 요약. 어느 상태에서든 위에 붙는다. */
function SurveySummary({
  booking,
  status,
}: {
  booking: Booking;
  status: Booking["status"];
}) {
  const rows: [string, string][] = [
    ["목적", booking.purpose],
    [
      "예산",
      `${(booking.budget_min / 10000).toFixed(0)}~${(booking.budget_max / 10000).toFixed(0)}만원`,
    ],
    ["신경 쓰이는 부위", booking.concerns.join(" · ") || "—"],
  ];

  return (
    <section className="mx-4 rounded-2xl bg-neutral-100 p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-[10.5px] font-semibold text-neutral-500">고수</span>
        <span className="text-[13.5px] font-bold">{booking.expert_nickname}</span>
        <Temperature value={booking.expert_temperature} size={12} />
        <span className="ml-auto">
          <StatusPill status={status} />
        </span>
      </div>
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-3 py-1 text-[12.5px]">
          <span className="w-[90px] shrink-0 text-neutral-500">{k}</span>
          <span className="flex-1">{v}</span>
        </div>
      ))}
    </section>
  );
}

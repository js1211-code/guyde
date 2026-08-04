"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import {
  AnswerView,
  ConsultStepper,
  SubmittedMark,
} from "@/components/consulting";
import { CheckIcon } from "@/components/icons";
import {
  AppShell,
  BottomBar,
  ScreenBody,
  TopBar,
} from "@/components/shell";
import { CONSULTING_SLA_HOURS } from "@/lib/constants";
import {
  fetchBooking,
  sendFeedback,
  type BookingDetail,
} from "@/lib/api/consulting-client";

/**
 * ⑰㉒㉕㉖㉗ 컨설팅 상세 — 한 화면이 status에 따라 다섯 얼굴을 한다.
 *
 * 화면을 상태별로 쪼개지 않은 이유: 머리(고수·설문 요약)와 스테퍼가 전부 같고
 * 달라지는 건 본문과 하단 액션뿐이다. 쪼개면 같은 헤더를 다섯 번 고쳐야 한다.
 *
 *   신청 접수   → 아직 답변 없음. SLA 안내만.
 *   답변 도착   → 답변 전문 + [이대로 좋아요] / [수정을 요청해요]
 *   수정 요청됨 → 고수가 확정안을 만드는 중
 *   완료        → 확정안 + 마무리
 *
 * 담당 고수가 열면 답변을 쓰러 가는 버튼이 뜬다 — 같은 건을 반대편에서 본다.
 */
export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchBooking(id)
      .then(setBooking)
      .catch(() => setFailed(true));
  }, [id]);

  useEffect(load, [load]);

  if (failed) {
    return (
      <AppShell>
        <TopBar backHref="/me/bookings" title="내 컨설팅" />
        <ScreenBody className="px-4 pt-10">
          <p className="text-center text-[13px] text-neutral-600">
            컨설팅을 찾을 수 없어요
          </p>
        </ScreenBody>
      </AppShell>
    );
  }

  if (!booking) {
    return (
      <AppShell>
        <TopBar backHref="/me/bookings" title="내 컨설팅" />
        <ScreenBody className="px-4 pt-10">
          <p className="text-center text-[13px] text-neutral-500">불러오는 중…</p>
        </ScreenBody>
      </AppShell>
    );
  }

  const answer = booking.answers.at(-1) ?? null;

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      await sendFeedback(id, "만족");
      load();
    } catch (e) {
      setError((e as { detail?: string }).detail ?? "처리에 실패했어요");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <TopBar
        backHref={booking.is_expert && !booking.is_owner ? "/consulting" : "/me/bookings"}
        title={booking.is_expert && !booking.is_owner ? "받은 신청" : "내 컨설팅"}
      />

      <ScreenBody className="pb-2">
        {booking.status === "신청 접수" && (
          <section className="flex flex-col items-center px-4 pt-6 pb-1 text-center">
            <SubmittedMark />
            <p className="mt-4 text-[17px] font-bold">
              {booking.is_expert ? "답변을 기다리고 있어요" : "신청이 접수됐어요"}
            </p>
            <p className="mt-1.5 text-[13px] text-neutral-600">
              {CONSULTING_SLA_HOURS}시간 안에 1회차 답변이 도착해요
            </p>
            <p className="cond mt-1 text-[13px] font-bold text-brand">
              {booking.due_label}
            </p>
          </section>
        )}

        <section className="px-4 pt-5 pb-4">
          <ConsultStepper status={booking.status} />
        </section>

        <SurveySummary booking={booking} />

        {booking.status === "수정 요청됨" && (
          <section className="mx-4 mt-4 rounded-2xl bg-danger-tint p-4">
            <p className="text-[13px] font-bold text-danger">수정을 요청했어요</p>
            <p className="mt-2 text-[11.5px] text-neutral-600">
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
            <AnswerView answer={answer} budget={booking.budget} />
          </section>
        )}

        {booking.status === "완료" && (
          <section className="mx-4 mb-4 rounded-2xl bg-ok-tint p-4">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-ok">
              <CheckIcon size={14} />
              컨설팅이 끝났어요
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-700">
              링크는 계속 열어둘게요. 사이즈가 애매하면 착장 카드의 이유를 다시
              읽어보세요.
            </p>
          </section>
        )}

        {error && (
          <p className="mx-4 mb-3 rounded-md bg-danger-tint px-3 py-2.5 text-[12.5px] text-danger">
            {error}
          </p>
        )}
      </ScreenBody>

      {/* 고수가 답변을 써야 하는 상태 */}
      {booking.is_expert &&
        (booking.status === "신청 접수" || booking.status === "수정 요청됨") && (
          <BottomBar>
            <Link
              href={`/consulting/${booking.id}/answer`}
              className="cond block w-full rounded-md bg-brand py-3.5 text-center text-[15px] font-bold text-white"
            >
              {booking.status === "수정 요청됨" ? "확정안 작성하기" : "답변 작성하기"}
            </Link>
          </BottomBar>
        )}

      {/* 신청자가 답변을 받아본 상태 */}
      {booking.is_owner && booking.status === "답변 도착" && (
        <BottomBar>
          <p className="mb-2 text-center text-[12px] text-neutral-600">
            이 답변으로 확정할까요?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || booking.revision_count > 0}
              onClick={() => router.push(`/booking/done/${booking.id}/revise`)}
              className="flex-1 rounded-md border border-neutral-300 py-3.5 text-[14px] font-semibold text-neutral-700 disabled:opacity-45"
            >
              수정을 요청해요
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={accept}
              className="flex-1 rounded-md bg-brand py-3.5 text-[14px] font-bold text-white disabled:bg-neutral-300"
            >
              이대로 좋아요
            </button>
          </div>
          <p className="mt-2 text-center text-[11.5px] text-neutral-500">
            {booking.revision_count > 0
              ? "수정 요청은 이미 사용했어요 · 불만족 시 100% 환불"
              : "수정 요청은 1회 가능해요 · 불만족 시 100% 환불"}
          </p>
        </BottomBar>
      )}

      {booking.is_owner && booking.status === "신청 접수" && (
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
function SurveySummary({ booking }: { booking: BookingDetail }) {
  const rows: [string, string][] = [
    ["고수", booking.expert.nickname],
    ["목적", booking.purpose],
    ["예산", `${(booking.budget / 10000).toFixed(0)}만원`],
    ["신경 쓰이는 부위", booking.concerns.join(" · ") || "—"],
  ];
  if (booking.body_note) rows.push(["체형 메모", booking.body_note]);
  if (booking.style_note) rows.push(["원하는 스타일", booking.style_note]);

  return (
    <section className="mx-4 rounded-2xl border border-neutral-300 px-4 py-1">
      {rows.map(([k, v], i) => (
        <div
          key={k}
          className={`flex items-start gap-4 py-3 ${
            i > 0 ? "border-t border-dashed border-neutral-300" : ""
          }`}
        >
          <span className="shrink-0 text-[12.5px] text-neutral-500">{k}</span>
          {/* 값은 오른쪽 끝에 붙인다 — 라벨 폭이 제각각이라
              왼쪽 정렬하면 값이 들쭉날쭉해서 훑기 어렵다. */}
          <span className="flex-1 text-right text-[13px] leading-relaxed font-semibold">
            {v}
          </span>
        </div>
      ))}

      {/* 전신과 착장은 고수에게 다른 정보라 섞지 않고 나눠서 보여준다.
          전신은 체형, 착장은 이미 가진 옷이다. */}
      {(["전신", "착장"] as const).map((kind) => {
        const shots = booking.images.filter((i) => i.kind === kind);
        if (shots.length === 0) return null;
        return (
          <div
            key={kind}
            className="border-t border-dashed border-neutral-300 py-3"
          >
            <p className="mb-2 text-[12.5px] text-neutral-500">
              {kind === "전신" ? "전신 사진" : "자주 입는 옷"}
            </p>
            <div className="flex flex-wrap gap-2">
              {shots.map((img) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={img.url}
                  src={img.url}
                  alt={kind}
                  className="h-[62px] w-[62px] rounded-lg border border-neutral-300 object-cover"
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

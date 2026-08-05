"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { StarIcon } from "@/components/icons";
import {
  AppShell,
  BottomBar,
  PrimaryButton,
  ScreenBody,
  TopBar,
} from "@/components/shell";
import { Temperature } from "@/components/temperature";
import {
  fetchBooking,
  submitReview,
  type BookingDetail,
} from "@/lib/api/consulting-client";

const RATINGS = [1, 2, 3, 4, 5];

/**
 * 컨설팅 후기.
 *
 * '이대로 좋아요'를 누른 직후 바로 이 화면으로 온다. 목록으로 돌려보내면
 * 다시 찾아 들어와야 해서 대부분 안 쓴다 — 고수 평점이 쌓이는 유일한 경로라
 * 흐름 안에서 받아야 한다.
 *
 * 별점만 필수고 글은 선택이다. 한 줄도 안 쓰면 안 남기느니만 못하다는 생각에
 * 글까지 필수로 하면 별점조차 안 남는다.
 */
export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBooking(id)
      .then(setBooking)
      .catch(() => setFailed(true));
  }, [id]);

  async function submit() {
    if (rating === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await submitReview(id, rating, body.trim());
      router.push(`/booking/done/${id}`);
    } catch (e) {
      setError((e as { detail?: string }).detail ?? "후기를 남기지 못했어요");
      setBusy(false);
    }
  }

  if (failed) {
    return (
      <AppShell>
        <TopBar backHref="/me/bookings" title="후기" />
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
        <TopBar backHref={`/booking/done/${id}`} title="후기" />
        <ScreenBody className="px-4 pt-10">
          <p className="text-center text-[13px] text-neutral-500">불러오는 중…</p>
        </ScreenBody>
      </AppShell>
    );
  }

  // 이미 남겼으면 다시 쓰게 두지 않는다. DB에도 한 건당 하나만 들어간다.
  if (booking.review) {
    return (
      <AppShell>
        <TopBar backHref={`/booking/done/${id}`} title="후기" />
        <ScreenBody className="px-4 pt-10 text-center">
          <p className="text-[14px] font-bold">이미 후기를 남겼어요</p>
          <p className="cond mt-3 text-[15px] text-brand">
            {"★".repeat(booking.review.rating)}
          </p>
          {booking.review.body && (
            <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-700">
              {booking.review.body}
            </p>
          )}
        </ScreenBody>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar backHref={`/booking/done/${id}`} title="후기" />

      <ScreenBody className="px-4 pt-6">
        <div className="text-center">
          <p className="text-[17px] font-bold">컨설팅은 어땠나요?</p>
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-[13px] text-neutral-600">
            {booking.expert.nickname}
            <Temperature value={booking.expert.temperature} size={12} />
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          {RATINGS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n}점`}
              aria-pressed={rating === n}
              className={`flex h-[46px] w-[46px] items-center justify-center rounded-full border ${
                n <= rating
                  ? "border-brand bg-brand/15"
                  : "border-neutral-300 text-neutral-400"
              }`}
            >
              <StarIcon size={22} className={n <= rating ? "text-brand" : ""} />
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[12px] text-neutral-500">
          {rating === 0 ? "별점을 골라주세요" : `${rating}점`}
        </p>

        <p className="mt-6 mb-2 text-[13.5px] font-bold">
          어떤 점이 좋았나요?
          <span className="ml-1 text-[11.5px] font-normal text-neutral-500">
            선택
          </span>
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="다음 사람이 이 고수를 고를 때 도움이 될 만한 점을 적어주세요"
          className="w-full rounded-md border border-neutral-300 px-3 py-2.5 text-[13.5px] leading-relaxed"
        />

        {error && (
          <p className="mt-3 rounded-md bg-danger-tint px-3 py-2.5 text-[12.5px] text-danger">
            {error}
          </p>
        )}
      </ScreenBody>

      <BottomBar>
        <PrimaryButton disabled={rating === 0 || busy} onClick={submit}>
          {busy ? "남기는 중…" : "후기 남기기"}
        </PrimaryButton>
        <button
          type="button"
          onClick={() => router.push(`/booking/done/${id}`)}
          className="mt-2 w-full text-center text-[12.5px] text-neutral-500"
        >
          나중에 할게요
        </button>
      </BottomBar>
    </AppShell>
  );
}

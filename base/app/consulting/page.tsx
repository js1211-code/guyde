"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusPill } from "@/components/consulting";
import { AppShell, NoticeBar, PageTitle, ScreenBody } from "@/components/shell";
import { TabBar } from "@/components/tab-bar";
import {
  fetchExpertInbox,
  type ExpertInboxItem,
} from "@/lib/api/consulting-client";

/**
 * 고수 콘솔 — 나에게 온 컨설팅 신청함.
 *
 * /me/bookings의 반대편이다. 저쪽은 "내가 신청한 것", 여기는 "내가 답해야 할 것".
 * 같은 bookings 테이블을 다른 쪽에서 본다.
 *
 * 고수로 등록되지 않은 기기는 403을 받는다. 빈 목록으로 돌려주면
 * "신청이 없구나"로 읽혀서 왜 안 보이는지 알 수가 없다.
 */
export default function ExpertConsolePage() {
  const [items, setItems] = useState<ExpertInboxItem[] | null>(null);
  const [notExpert, setNotExpert] = useState(false);

  useEffect(() => {
    fetchExpertInbox()
      .then((r) => setItems(r.items))
      .catch((e) => {
        if ((e as { code?: string }).code === "NOT_AN_EXPERT") setNotExpert(true);
        else setItems([]);
      });
  }, []);

  if (notExpert) {
    return (
      <AppShell>
        <PageTitle>고수 콘솔</PageTitle>
        <ScreenBody className="px-4 pt-10">
          <p className="text-center text-[13.5px] leading-relaxed text-neutral-600">
            이 기기는 고수로 등록되어 있지 않아요.
            <br />
            <span className="text-[12.5px] text-neutral-500">
              고수는 온도 42.0도를 넘긴 사람 중에서만 정해져요.
            </span>
          </p>
          <Link
            href="/experts"
            className="mt-6 block text-center text-[13px] font-bold text-brand"
          >
            컨설팅 둘러보기
          </Link>
        </ScreenBody>
        <TabBar />
      </AppShell>
    );
  }

  // 답변을 기다리는 건이 위로. 마감이 임박한 순서가 아니라 "할 일"이 먼저다.
  const pending = items?.filter((b) => b.needs_answer) ?? [];
  const done = items?.filter((b) => !b.needs_answer) ?? [];

  return (
    <AppShell>
      <PageTitle>고수 콘솔</PageTitle>
      <NoticeBar>답변은 신청 후 48시간 안에 보내야 해요</NoticeBar>

      <ScreenBody className="px-4 pt-4">
        {items === null && (
          <p className="py-10 text-center text-[13px] text-neutral-500">
            불러오는 중…
          </p>
        )}

        {items?.length === 0 && (
          <p className="py-10 text-center text-[13px] text-neutral-600">
            아직 들어온 신청이 없어요
          </p>
        )}

        {pending.length > 0 && (
          <>
            <p className="cond mb-2 text-[13px] font-semibold tracking-wide text-brand">
              답변 대기 {pending.length}건
            </p>
            {pending.map((b) => (
              <InboxCard key={b.id} booking={b} />
            ))}
          </>
        )}

        {done.length > 0 && (
          <>
            <p className="cond mt-5 mb-2 text-[13px] font-semibold tracking-wide text-neutral-600">
              지난 컨설팅 {done.length}건
            </p>
            {done.map((b) => (
              <InboxCard key={b.id} booking={b} />
            ))}
          </>
        )}
      </ScreenBody>

      {/* 고수도 커뮤니티·도서관·내정보를 그대로 쓴다. 탭바가 없으면
          받은 신청함에 들어온 순간 다른 화면으로 나갈 길이 없다. */}
      <TabBar />
    </AppShell>
  );
}

function InboxCard({ booking }: { booking: ExpertInboxItem }) {
  return (
    <Link
      href={`/booking/done/${booking.id}`}
      className="card mb-3 block rounded-2xl p-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-bold">{booking.purpose}</span>
        <span className="cond text-[13px] font-bold text-brand">
          {booking.budget / 10000}만원
        </span>
        <span className="ml-auto">
          <StatusPill status={booking.status} />
        </span>
      </div>
      {booking.concerns.length > 0 && (
        <p className="mt-1.5 text-[12.5px] text-neutral-600">
          {booking.concerns.join(" · ")}
        </p>
      )}
      <p className="mt-1 text-[11.5px] text-neutral-500">
        {booking.created_label} 신청 · {booking.due_label}
      </p>
    </Link>
  );
}

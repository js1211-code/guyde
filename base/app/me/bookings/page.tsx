"use client";

import { useEffect, useState } from "react";
import { BookingCard } from "@/components/consulting";
import { AppShell, ScreenBody, TopBar } from "@/components/shell";
import {
  fetchMyBookings,
  type BookingListItem,
} from "@/lib/api/consulting-client";

/**
 * 내 컨설팅 (F-76).
 * device_id 전용 조회다 — 전체 목록을 받아서 거르면 첫 페이지 밖이 빠진다.
 *
 * v2에선 상태가 '신청 접수' 하나뿐이라 목록이 사실상 영수증이었다.
 * v3는 4단계를 오가므로 상태 배지가 이 화면의 본체가 된다.
 */
export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingListItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchMyBookings()
      .then(setBookings)
      .catch(() => setFailed(true));
  }, []);

  return (
    <AppShell>
      <TopBar backHref="/me" title="내 컨설팅" />

      <ScreenBody className="px-4 pt-4">
        {failed && (
          <p className="py-10 text-center text-[13px] text-neutral-600">
            목록을 불러오지 못했어요
          </p>
        )}
        {!failed && bookings === null && (
          <p className="py-10 text-center text-[13px] text-neutral-500">
            불러오는 중…
          </p>
        )}
        {bookings?.length === 0 && (
          <p className="py-10 text-center text-[13px] text-neutral-600">
            신청한 컨설팅이 없어요
          </p>
        )}
        {bookings?.map((b) => <BookingCard key={b.id} booking={b} />)}
      </ScreenBody>
    </AppShell>
  );
}

import { BookingCard } from "@/components/consulting";
import { AppShell, ScreenBody, TopBar } from "@/components/shell";
import { getBookings } from "@/lib/mock";

/**
 * 내 컨설팅 (F-76).
 * v2에선 상태가 '신청 접수' 하나뿐이라 목록이 사실상 영수증이었다.
 * v3는 4단계를 오가므로 상태 배지가 이 화면의 본체가 된다.
 */
export default function MyBookingsPage() {
  const bookings = getBookings();

  return (
    <AppShell>
      <TopBar backHref="/me" title="내 컨설팅" />

      <ScreenBody className="px-4 pt-4">
        {bookings.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-neutral-600">
            신청한 컨설팅이 없어요
          </p>
        ) : (
          bookings.map((b) => <BookingCard key={b.id} booking={b} />)
        )}
      </ScreenBody>
    </AppShell>
  );
}

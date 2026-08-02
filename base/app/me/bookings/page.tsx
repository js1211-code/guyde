import { AppShell, ScreenBody, TopBar } from "@/components/shell";
import { Reg } from "@/components/reg";
import { getBookings } from "@/lib/mock";

/** 내 예약 (F-76) — 상태는 '신청 접수' 하나뿐이고 취소·전환이 없다 */
export default function MyBookingsPage() {
  const bookings = getBookings();

  return (
    <AppShell>
      <TopBar backHref="/me" title="내 예약" />

      <ScreenBody className="px-4 pt-4">
        {bookings.length === 0 && (
          <p className="py-10 text-center text-[13px] text-neutral-600">
            신청한 예약이 없어요
          </p>
        )}
        {bookings.map((b) => (
          <div
            key={b.id}
            className="relative mb-3 border border-neutral-400 p-3.5"
          >
            <Reg corners="tl br" />
            <div className="flex items-center justify-between">
              <span className="text-[14.5px] font-bold">{b.expert_nickname}</span>
              <span className="border border-brand-tint-b bg-brand-tint px-2 py-px text-[11px] font-bold text-brand-dark">
                {b.status}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] text-neutral-700">{b.slot_label}</p>
            <p className="mt-1 text-[12.5px] text-neutral-600">
              {b.concerns.join(", ")}
            </p>
          </div>
        ))}
      </ScreenBody>
    </AppShell>
  );
}

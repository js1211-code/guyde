import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon } from "@/components/icons";
import { Reg } from "@/components/reg";
import { AppShell, BottomBar } from "@/components/shell";
import { getBookings, getExpert, getExpertIds } from "@/lib/mock";

export function generateStaticParams() {
  return getExpertIds().map((id) => ({ id }));
}

/**
 * ⑰ 예약 완료.
 * 상태는 '신청 접수' 하나뿐이고 전환이 없다(F-60) — 상태 머신을 만들지 않는다.
 */
export default async function BookingDonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expert = getExpert(id);
  if (!expert) notFound();

  // 실제로는 방금 만든 예약 레코드를 읽어온다. 지금은 목 예약 1건.
  const booking = getBookings()[0];

  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center border-2 border-brand">
          <Reg corners="tl tr bl br" />
          <CheckIcon size={28} className="text-brand" />
        </div>
        <p className="text-[19px] font-bold">신청이 접수됐어요</p>
        <span className="mt-2 border border-brand-tint-b bg-brand-tint px-2 py-1 text-[11px] font-bold text-brand-dark">
          신청 접수
        </span>

        <div className="relative mt-5 w-full border border-neutral-400 p-4 text-left">
          <Reg corners="tl br" />
          <Row label="고수" value={expert.nickname} />
          <Row label="일시" value={booking.slot_label} divider />
          <Row label="고민 항목" value={booking.concerns.join(", ")} divider />
        </div>
      </div>

      <BottomBar bordered={false}>
        <Link
          href="/me/bookings"
          className="cond block border border-brand py-3.5 text-center text-[15px] font-bold text-brand"
        >
          내 예약 보기
        </Link>
      </BottomBar>
    </AppShell>
  );
}

function Row({
  label,
  value,
  divider = false,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-1.5 text-[13.5px] ${
        divider ? "border-t border-dashed border-neutral-400" : ""
      }`}
    >
      <span className="text-neutral-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

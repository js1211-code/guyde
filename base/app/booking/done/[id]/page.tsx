import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon } from "@/components/icons";
import { SERVICE_LABEL, type ServiceFormat } from "@/components/expert-booking";
import { Reg } from "@/components/reg";
import { AppShell, BottomBar } from "@/components/shell";
import { getExpert } from "@/lib/mock";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const AUG_2026_OFFSET = 6;

/**
 * ⑰ 예약 완료.
 * 상태는 '신청 접수' 하나뿐이고 전환이 없다(F-60) — 상태 머신을 만들지 않는다.
 * 방금 넣은 신청 내용은 쿼리로 넘어온다(아직 예약 저장 API가 없어서).
 */
export default async function BookingDonePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    format?: string;
    day?: string;
    time?: string;
    concerns?: string;
  }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const expert = getExpert(id);
  if (!expert) notFound();

  const format: ServiceFormat = q.format === "video" ? "video" : "chat";
  const day = Number(q.day);
  const slotLabel =
    Number.isFinite(day) && q.time
      ? `8월 ${day}일(${WEEKDAYS[(AUG_2026_OFFSET + day - 1) % 7]}) ${q.time}`
      : "일정 미정";
  const concerns = q.concerns?.split(",").filter(Boolean) ?? [];

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
          <Row label="상담 형식" value={SERVICE_LABEL[format]} divider />
          <Row label="일시" value={slotLabel} divider />
          <Row
            label="고민 항목"
            value={concerns.length ? concerns.join(", ") : "선택 안 함"}
            divider
          />
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
      className={`flex justify-between gap-3 py-1.5 text-[13.5px] ${
        divider ? "border-t border-dashed border-neutral-400" : ""
      }`}
    >
      <span className="shrink-0 text-neutral-600">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

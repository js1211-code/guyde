import { notFound } from "next/navigation";
import {
  AppShell,
  BottomBar,
  Kicker,
  ScreenBody,
  TopBar,
} from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { CardIcon, LockIcon } from "@/components/icons";
import { ReviewSheet } from "@/components/review-sheet";
import { StatusStepper, type Step } from "@/components/status-stepper";
import { getBooking, getBookingIds, type BookingStatus } from "@/lib/mock";

export function generateStaticParams() {
  return getBookingIds().map((id) => ({ id }));
}

/** bookings.status를 3단계 표시로 접는다. */
function toSteps(status: BookingStatus): Step[] {
  const paid = status !== "requested" && status !== "cancelled";
  const inSession = status === "in_session" || status === "completed";
  const done = status === "completed";
  return [
    { label: "결제 완료", done: paid },
    { label: "상담 중", done: inSession },
    { label: "완료", done },
  ];
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getBooking(id);
  if (!data) notFound();

  const { booking, expert, service } = data;
  const isDone = booking.status === "completed";

  return (
    <AppShell>
      <div className="relative flex min-h-dvh flex-col">
        <TopBar
          backHref={`/experts/${expert.id}`}
          title={isDone ? "상담 완료" : "예약·결제"}
        />

        <ScreenBody className="px-4 pt-4">
          {!isDone && <Kicker className="mb-1.5">ORDER</Kicker>}

          <div
            className={`p-3.5 ${
              isDone ? "border border-neutral-400" : "border border-neutral-500"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[14.5px] font-bold">
                    {expert.nickname}
                  </span>
                  <Badge variant="ink" cond>
                    {expert.grade}
                  </Badge>
                </div>
                <p className="mt-1 text-[12.5px] text-neutral-600">
                  {service.title} ·{" "}
                  {isDone ? booking.period_label : service.description}
                </p>
              </div>
              {isDone ? (
                <span className="cond text-[13px] font-bold tracking-[0.08em] text-accent-700">
                  DONE
                </span>
              ) : (
                <span className="cond text-[20px] font-bold text-accent-700">
                  ₩{booking.price.toLocaleString("ko-KR")}
                </span>
              )}
            </div>
          </div>

          {!isDone && (
            <>
              <Kicker className="mt-5 mb-1.5">PAYMENT</Kicker>
              {/* 토스페이먼츠 샌드박스 위젯이 붙을 자리 */}
              <div className="flex h-[120px] flex-col items-center justify-center gap-1.5 border border-dashed border-neutral-500 bg-neutral-200">
                <CardIcon size={20} className="text-neutral-500" />
                <span className="text-[12.5px] font-medium text-neutral-600">
                  토스페이먼츠 결제 위젯
                </span>
                <span className="cond text-[11px] tracking-wide text-neutral-600">
                  WIDGET PLACEHOLDER
                </span>
              </div>
            </>
          )}

          <Kicker className={isDone ? "sr-only" : "mt-5 mb-2.5"}>STATUS</Kicker>
          <div className={isDone ? "mt-4" : ""}>
            <StatusStepper steps={toSteps(booking.status)} />
          </div>

          {!isDone && (
            <p className="mt-5 flex items-center gap-2 border border-accent-200 bg-accent-100 px-3 py-2.5">
              <LockIcon size={15} className="shrink-0 text-accent-700" />
              <span className="text-[12.5px] text-neutral-700">
                상담이 끝날 때까지 결제금은 안전하게 보관돼요
              </span>
            </p>
          )}
        </ScreenBody>

        {isDone ? (
          <ReviewSheet
            expertName={expert.nickname}
            serviceTitle={service.title}
          />
        ) : (
          <BottomBar>
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center bg-accent text-[15px] font-bold text-white"
            >
              ₩{booking.price.toLocaleString("ko-KR")} 결제하기
            </button>
          </BottomBar>
        )}
      </div>
    </AppShell>
  );
}

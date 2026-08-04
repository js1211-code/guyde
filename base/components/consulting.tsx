import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/constants";
import type {
  BookingListItem,
  ConsultingAnswer,
} from "@/lib/api/consulting-client";

/**
 * 컨설팅 진행 단계. bookings.status의 4개 값과 순서까지 같아야 해서
 * lib/constants.ts의 목록을 그대로 쓴다 — 여기서 다시 나열하면
 * DB 상태가 늘었을 때 스테퍼만 조용히 옛날 것으로 남는다.
 */
export const CONSULT_STEPS = BOOKING_STATUSES;

/**
 * ⑰·㉒ 4단계 스테퍼.
 * '수정 요청됨'은 건너뛸 수 있는 단계라, 지나가지 않았으면 흐리게만 둔다.
 */
export function ConsultStepper({ status }: { status: BookingStatus }) {
  const current = CONSULT_STEPS.indexOf(status);

  return (
    <ol className="flex items-center gap-1.5">
      {CONSULT_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-bold ${
                done
                  ? "bg-ok text-white"
                  : active
                    ? "bg-brand text-white"
                    : "bg-neutral-200 text-neutral-500"
              }`}
            >
              {done ? <CheckIcon size={13} /> : i + 1}
            </span>
            <span
              className={`text-center text-[10.5px] leading-tight ${
                active ? "font-bold text-brand" : "text-neutral-500"
              }`}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * 착장 합계 배지. 예산 대비 80~100%면 초록, 미달이면 주황, 초과면 빨강.
 * 기준을 화면마다 다시 쓰지 않게 여기 한 곳에 둔다.
 * (DB에선 outfit_totals 뷰의 pct_of_budget이 같은 숫자를 준다)
 */
export function BudgetBadge({
  total,
  budget,
}: {
  total: number;
  budget: number;
}) {
  const pct = budget > 0 ? Math.round((total * 100) / budget) : 0;
  const tone =
    pct > 100
      ? { box: "bg-danger-tint", label: "text-danger", num: "text-danger" }
      : pct >= 80
        ? { box: "bg-ok-tint", label: "text-ok", num: "text-ok-deep" }
        : { box: "bg-brand-tint", label: "text-warn", num: "text-warn" };

  return (
    <div className={`flex items-center justify-between rounded-2xl p-4 ${tone.box}`}>
      <div>
        <p className={`text-[11.5px] font-semibold ${tone.label}`}>합계</p>
        <p className={`cond mt-1 text-[25px] leading-none font-bold ${tone.num}`}>
          {total.toLocaleString("ko-KR")}원
        </p>
      </div>
      <span
        className={`rounded-full bg-white px-2.5 py-1.5 text-[12px] font-bold ${tone.label}`}
      >
        예산 {budget.toLocaleString("ko-KR")}원의 {pct}%
      </span>
    </div>
  );
}

/** ㉗·㉙ 고수 답변 한 회차를 통째로 그린다. 읽기 전용. */
export function AnswerView({
  answer,
  budget,
}: {
  answer: ConsultingAnswer;
  budget: number;
}) {
  return (
    <div>
      <Section title="① 진단">
        <p className="text-[13.5px] leading-relaxed">{answer.diagnosis}</p>
      </Section>

      <Section title="② 피해야 할 것">
        <div className="flex flex-wrap gap-2">
          {answer.avoid.map((a) => (
            <span
              key={a}
              className="rounded-full border border-danger-line bg-danger-tint px-2.5 py-1 text-[12px] font-semibold text-danger"
            >
              {a}
            </span>
          ))}
        </div>
      </Section>

      <Section title="③ 착장 1세트">
        <BudgetBadge total={answer.total} budget={budget} />
        <div className="mt-3">
          {answer.items.map((item) => (
            <div key={item.slot} className="card mb-3 rounded-3xl p-4">
              <div className="mb-2.5 flex items-center gap-1.5">
                <span className="text-[15px] font-bold">{item.slot}</span>
                <span className="cond ml-auto text-[14px] font-bold">
                  {item.price.toLocaleString("ko-KR")}원
                </span>
              </div>

              <p className="text-[13px] font-bold">{item.name}</p>
              <p className="mt-0.5 text-[11px] text-neutral-500">{item.brand}</p>

              <ShopLink url={item.url} />
              {item.alt_url && <ShopLink url={item.alt_url} alt />}

              <p className="mt-3 mb-1 text-[12px] font-semibold text-neutral-600">
                왜 이 아이템인가요?
              </p>
              <div className="rounded-r-md border-l-[3px] border-brand bg-brand-tint py-2.5 pr-3 pl-3">
                <p className="text-[12.5px] leading-relaxed">{item.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function ShopLink({ url, alt = false }: { url: string; alt?: boolean }) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-md bg-brand-tint px-3 py-2.5">
      {alt && (
        <span className="rounded-xs bg-neutral-300 px-1.5 py-0.5 text-[10px] font-bold text-neutral-700">
          대체
        </span>
      )}
      <span className="flex-1 truncate text-[12.5px] text-brand-dark">{url}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <p className="mb-2 text-[13.5px] font-bold">{title}</p>
      {children}
    </section>
  );
}

/** 내 컨설팅 목록의 카드 한 장. */
export function BookingCard({ booking }: { booking: BookingListItem }) {
  return (
    <Link
      href={`/booking/done/${booking.id}`}
      className="card mb-3 block rounded-2xl p-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-bold">{booking.expert.nickname}</span>
        <StatusPill status={booking.status} />
      </div>
      <p className="mt-1.5 text-[12.5px] text-neutral-600">
        {booking.purpose} · 예산 {(booking.budget / 10000).toFixed(0)}만원 ·{" "}
        {booking.created_label} 신청
      </p>
      <p className="mt-1 text-[11.5px] text-neutral-500">{booking.due_label}</p>
    </Link>
  );
}

export function StatusPill({ status }: { status: BookingStatus }) {
  const tone =
    status === "완료"
      ? "bg-ok-tint text-ok"
      : status === "수정 요청됨"
        ? "bg-danger-tint text-danger"
        : status === "답변 도착"
          ? "bg-brand text-white"
          : "bg-neutral-200 text-neutral-600";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${tone}`}>
      {status}
    </span>
  );
}

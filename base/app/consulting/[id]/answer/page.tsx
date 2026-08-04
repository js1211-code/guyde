"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { BudgetBadge, SlotLabel } from "@/components/consulting";
import { CheckIcon } from "@/components/icons";
import {
  AppShell,
  BottomBar,
  PrimaryButton,
  ScreenBody,
  TopBar,
} from "@/components/shell";
import {
  OUTFIT_REASON_MIN,
  OUTFIT_SLOTS,
  type OutfitSlot,
} from "@/lib/constants";
import {
  fetchBooking,
  submitAnswer,
  type BookingDetail,
} from "@/lib/api/consulting-client";

type Draft = {
  url: string;
  alt_url: string;
  brand: string;
  name: string;
  price: string;
  reason: string;
};

const EMPTY: Draft = { url: "", alt_url: "", brand: "", name: "", price: "", reason: "" };

/**
 * ㉘ 고수 답변 작성.
 *
 * 세 단계를 한 화면에서 위에서 아래로 채운다 — 진단 → 피해야 할 것 → 착장 1세트.
 * 단계를 화면으로 쪼개지 않은 이유: 착장을 고르다 보면 진단을 고치고 싶어지는데,
 * 화면이 나뉘어 있으면 되돌아가느라 흐름이 끊긴다.
 *
 * 이 화면의 목적은 "링크만 던지는 답변"을 구조적으로 불가능하게 만드는 것이다.
 *   - 상의·하의·신발 세 칸이 전부 차야 제출된다. 한 칸이라도 비면 받는 쪽이
 *     결국 스스로 채워야 하고, 그러면 컨설팅이 아니다.
 *   - 아이템마다 "왜 이걸 골랐는지"를 20자 이상 받는다. 이 이유가 컨설팅의 본체다.
 * 같은 규칙이 API와 DB CHECK에도 있다 — 화면만 막으면 우회된다.
 */
export default function AnswerWritePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [denied, setDenied] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [avoidInput, setAvoidInput] = useState("");
  const [avoid, setAvoid] = useState<string[]>([]);
  const [items, setItems] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(OUTFIT_SLOTS.map((s) => [s, { ...EMPTY }])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBooking(id)
      .then((b) => {
        if (!b.is_expert) setDenied(true);
        else setBooking(b);
      })
      .catch(() => setDenied(true));
  }, [id]);

  const total = useMemo(
    () =>
      OUTFIT_SLOTS.reduce((sum, s) => sum + (Number(items[s]?.price) || 0), 0),
    [items],
  );

  const patch = (slot: string, key: keyof Draft, value: string) =>
    setItems((prev) => ({ ...prev, [slot]: { ...prev[slot], [key]: value } }));

  const addAvoid = () => {
    const v = avoidInput.trim();
    if (!v || avoid.includes(v)) return;
    setAvoid((prev) => [...prev, v]);
    setAvoidInput("");
  };

  const slotDone = (slot: string) => {
    const d = items[slot];
    return (
      d.url.trim() !== "" &&
      d.name.trim() !== "" &&
      Number(d.price) > 0 &&
      d.reason.trim().length >= OUTFIT_REASON_MIN
    );
  };

  const canSubmit =
    diagnosis.trim().length >= OUTFIT_REASON_MIN &&
    avoid.length > 0 &&
    OUTFIT_SLOTS.every(slotDone) &&
    !busy;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await submitAnswer(id, {
        diagnosis: diagnosis.trim(),
        avoid,
        items: OUTFIT_SLOTS.map((slot) => ({
          slot: slot as OutfitSlot,
          url: items[slot].url.trim(),
          alt_url: items[slot].alt_url.trim() || undefined,
          brand: items[slot].brand.trim() || undefined,
          name: items[slot].name.trim(),
          price: Number(items[slot].price),
          reason: items[slot].reason.trim(),
        })),
      });
      router.push(`/booking/done/${id}`);
    } catch (e) {
      setError((e as { detail?: string }).detail ?? "답변을 보내지 못했어요");
      setBusy(false);
    }
  }

  if (denied) {
    return (
      <AppShell>
        <TopBar backHref="/consulting" title="답변 작성" />
        <ScreenBody className="px-4 pt-10">
          <p className="text-center text-[13px] leading-relaxed text-neutral-600">
            이 컨설팅의 담당 고수가 아니에요
          </p>
        </ScreenBody>
      </AppShell>
    );
  }

  if (!booking) {
    return (
      <AppShell>
        <TopBar backHref="/consulting" title="답변 작성" />
        <ScreenBody className="px-4 pt-10">
          <p className="text-center text-[13px] text-neutral-500">불러오는 중…</p>
        </ScreenBody>
      </AppShell>
    );
  }

  const round = booking.status === "수정 요청됨" ? 2 : 1;

  return (
    <AppShell>
      <TopBar
        backHref={`/booking/done/${id}`}
        title={round === 2 ? "확정안 작성" : "답변 작성"}
      />

      <ScreenBody className="px-4 pt-3 pb-2">
        {/* 신청 내용 — 답을 쓰는 내내 보여야 한다 */}
        <section className="mb-5 rounded-2xl bg-neutral-100 p-4">
          <p className="mb-2 text-[12px] font-semibold text-neutral-500">
            신청 내용
          </p>
          <Row k="목적" v={booking.purpose} />
          <Row k="예산" v={`${(booking.budget / 10000).toFixed(0)}만원`} />
          <Row k="신경 쓰이는 부위" v={booking.concerns.join(" · ") || "—"} />
          {booking.body_note && <Row k="체형 메모" v={booking.body_note} />}
          {booking.style_note && <Row k="원하는 스타일" v={booking.style_note} />}
          {booking.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {booking.images.map((img) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={img.url}
                  src={img.url}
                  alt={img.kind}
                  className="h-[68px] w-[68px] rounded-lg border border-neutral-300 object-cover"
                />
              ))}
            </div>
          )}
        </section>

        {/* ① 진단 */}
        <Step n="①" title="진단" done={diagnosis.trim().length >= OUTFIT_REASON_MIN}>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={4}
            placeholder="체형과 사진을 보고 무엇이 문제인지, 어떤 방향으로 가야 하는지 적어주세요"
            className="w-full rounded-md border border-neutral-300 px-3 py-2.5 text-[13px] leading-relaxed"
          />
          <Counter len={diagnosis.trim().length} min={OUTFIT_REASON_MIN} />
        </Step>

        {/* ② 피해야 할 것 */}
        <Step n="②" title="피해야 할 것" done={avoid.length > 0}>
          <div className="flex gap-2">
            <input
              value={avoidInput}
              onChange={(e) => setAvoidInput(e.target.value)}
              onKeyDown={(e) => {
                // 한글 조합 중의 Enter는 확정이지 추가가 아니다.
                // 안 거르면 칩이 두 개씩 생긴다(댓글에서 겪은 것과 같은 문제).
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                addAvoid();
              }}
              placeholder="예) 오버핏 후드"
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-[13px]"
            />
            <button
              type="button"
              onClick={addAvoid}
              className="rounded-md border border-brand px-3 text-[13px] font-bold text-brand"
            >
              추가
            </button>
          </div>
          {avoid.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {avoid.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvoid((prev) => prev.filter((x) => x !== a))}
                  className="rounded-full border border-danger-line bg-danger-tint px-2.5 py-1 text-[12px] font-semibold text-danger"
                >
                  {a} ×
                </button>
              ))}
            </div>
          )}
        </Step>

        {/* ③ 착장 1세트 */}
        <Step n="③" title="착장 1세트" done={OUTFIT_SLOTS.every(slotDone)}>
          <BudgetBadge total={total} budget={booking.budget} />
          <p className="mt-2 mb-4 text-[11px] leading-relaxed text-neutral-500">
            합계가 예산의 80~100%면 초록 배지가 돼요. 벗어나면 주황·빨강으로 바뀝니다.
          </p>

          {OUTFIT_SLOTS.map((slot) => (
            <div key={slot} className="card mb-3 rounded-3xl p-4">
              <div className="mb-3 flex items-center gap-1.5">
                <SlotLabel slot={slot} />
                {slotDone(slot) ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-ok">
                    <CheckIcon size={12} /> 완료
                  </span>
                ) : (
                  <Required />
                )}
              </div>

              <Label>구매 링크</Label>
              <Input
                value={items[slot].url}
                onChange={(v) => patch(slot, "url", v)}
                placeholder="상품 링크를 붙여넣어 주세요"
                invalid={items[slot].url.trim() === ""}
              />

              <Label optional>대체 링크 (품절 대비)</Label>
              <Input
                value={items[slot].alt_url}
                onChange={(v) => patch(slot, "alt_url", v)}
                placeholder="선택"
              />

              <div className="mt-3 flex gap-2">
                <div className="flex-1">
                  <Label>상품명</Label>
                  <Input
                    value={items[slot].name}
                    onChange={(v) => patch(slot, "name", v)}
                    placeholder="세미오버핏 코튼 셔츠 · 네이비"
                    invalid={items[slot].name.trim() === ""}
                  />
                </div>
                <div className="w-[104px]">
                  <Label>가격</Label>
                  <Input
                    value={items[slot].price}
                    onChange={(v) => patch(slot, "price", v.replace(/[^\d]/g, ""))}
                    placeholder="59000"
                    inputMode="numeric"
                    invalid={!(Number(items[slot].price) > 0)}
                  />
                </div>
              </div>

              <Label optional>브랜드</Label>
              <Input
                value={items[slot].brand}
                onChange={(v) => patch(slot, "brand", v)}
                placeholder="무신사 스탠다드"
              />

              <div className="mt-3 mb-1 flex items-center gap-1">
                <p className="text-[12px] font-semibold text-neutral-600">
                  왜 이 아이템인가요?
                </p>
                <Required />
                <span className="text-[11px] text-neutral-500">
                  최소 {OUTFIT_REASON_MIN}자
                </span>
              </div>
              <textarea
                value={items[slot].reason}
                onChange={(e) => patch(slot, "reason", e.target.value)}
                rows={3}
                placeholder="이 사람의 체형·목적과 이 아이템이 어떻게 맞는지 적어주세요"
                className="w-full rounded-md border border-neutral-300 px-3 py-2.5 text-[13px] leading-relaxed"
              />
              <Counter
                len={items[slot].reason.trim().length}
                min={OUTFIT_REASON_MIN}
              />
            </div>
          ))}
        </Step>

        {error && (
          <p className="mb-3 rounded-md bg-danger-tint px-3 py-2.5 text-[12.5px] text-danger">
            {error}
          </p>
        )}
      </ScreenBody>

      <BottomBar>
        <PrimaryButton disabled={!canSubmit} onClick={submit}>
          {busy
            ? "보내는 중…"
            : round === 2
              ? "확정안 보내기"
              : "답변 보내기"}
        </PrimaryButton>
        <p className="mt-2 text-center text-[11.5px] text-neutral-500">
          {canSubmit
            ? round === 2
              ? "확정안은 수정할 수 없어요"
              : "보내면 신청자가 바로 확인해요"
            : "진단 · 피해야 할 것 · 착장 세 칸을 모두 채워주세요"}
        </p>
      </BottomBar>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3 py-1 text-[12.5px]">
      <span className="w-[90px] shrink-0 text-neutral-500">{k}</span>
      <span className="flex-1 leading-relaxed">{v}</span>
    </div>
  );
}

function Step({
  n,
  title,
  done,
  children,
}: {
  n: string;
  title: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <p className="mb-2 flex items-center gap-1.5 text-[14px] font-bold">
        <span className={done ? "text-ok" : "text-brand"}>{n}</span>
        {title}
        {done && <CheckIcon size={14} className="text-ok" />}
      </p>
      {children}
    </section>
  );
}

function Label({
  children,
  optional = false,
}: {
  children?: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <p className="mt-3 mb-1.5 flex items-center gap-1 text-[11.5px] font-semibold text-neutral-500 first:mt-0">
      {children}
      {optional ? <span className="font-normal">· 선택</span> : <Required />}
    </p>
  );
}

/**
 * 필수 표시. 뱃지 대신 별표 하나 —
 * 이 화면은 필수 항목이 열 개가 넘어서 뱃지를 붙이면 그것만 눈에 들어온다.
 * 색은 사전 설문의 별표와 같은 토큰을 쓴다. 같은 기호가 화면마다 다른 색이면
 * 다른 뜻으로 읽힌다. (빨강은 오류를 뜻해서 피했다)
 */
function Required() {
  return (
    <span className="text-required text-[13px] leading-none" aria-label="필수">
      *
    </span>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  invalid = false,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
  inputMode?: "numeric";
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className={`w-full rounded-md border px-3 py-2.5 text-[13px] ${
        invalid && value !== ""
          ? "border-danger-line bg-danger-tint"
          : "border-neutral-300"
      }`}
    />
  );
}

function Counter({ len, min }: { len: number; min: number }) {
  return (
    <p
      className={`mt-1 text-right text-[11px] ${
        len >= min ? "text-neutral-500" : "text-danger"
      }`}
    >
      {len} / 최소 {min}자
    </p>
  );
}

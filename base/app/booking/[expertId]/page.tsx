"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { Chip, PhotoBox, PhotoSlot } from "@/components/badge";
import {
  AppShell,
  BottomBar,
  PrimaryButton,
  ScreenBody,
  TopBar,
} from "@/components/shell";
import {
  CONSULT_BUDGETS,
  CONSULT_BUDGET_SUPPORTED,
  CONSULT_CONCERNS,
  CONSULT_PURPOSES,
  CONSULTING_SLA_HOURS,
  getExpert,
} from "@/lib/mock";

const PHOTO_MAX = 5;

/**
 * ⑯ 사전 설문.
 *
 * v2의 달력·시간 슬롯을 대체하는 화면이다. 고수가 답을 쓰려면 체형이 보여야
 * 하므로 전신 사진이 필수고, 이게 없으면 신청 버튼이 열리지 않는다.
 *
 * "얼굴은 가려도 괜찮아요"를 사진 영역 바로 옆에 붙여둔다.
 * 이 문구가 없으면 대부분 여기서 그만둔다 — 사진 요구가 이 흐름의 최대 관문이다.
 *
 * 예산은 지금 15~30만원만 지원한다. 나머지 구간을 목록에서 빼는 대신
 * 잠근 채로 보여준다 — 없는 줄 알고 떠나는 것보다 기다리게 하는 편이 낫다.
 */
export default function BookingSurveyPage({
  params,
}: {
  params: Promise<{ expertId: string }>;
}) {
  const { expertId } = use(params);
  const expert = getExpert(expertId);
  const router = useRouter();

  const [purpose, setPurpose] = useState<string | null>(null);
  const [budget, setBudget] = useState<string>(CONSULT_BUDGET_SUPPORTED);
  const [bodyPhotos, setBodyPhotos] = useState<string[]>([]);
  const [outfitPhotos, setOutfitPhotos] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [bodyNote, setBodyNote] = useState("");
  const [styleNote, setStyleNote] = useState("");

  if (!expert) {
    return (
      <AppShell>
        <TopBar backHref="/experts" title="사전 설문" />
        <ScreenBody className="px-4 pt-10">
          <p className="text-center text-[13px] text-neutral-600">
            고수를 찾을 수 없어요
          </p>
        </ScreenBody>
      </AppShell>
    );
  }

  const toggleConcern = (c: string) =>
    setConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const addPhoto =
    (set: React.Dispatch<React.SetStateAction<string[]>>) => (file: File) =>
      set((prev) =>
        prev.length >= PHOTO_MAX ? prev : [...prev, URL.createObjectURL(file)],
      );

  // 전신 사진이 없으면 고수가 판단할 근거 자체가 없다. 나머지는 없어도 답이 나온다.
  const canSubmit = Boolean(purpose) && bodyPhotos.length > 0;

  return (
    <AppShell>
      <TopBar backHref={`/experts/${expert.id}`} title="사전 설문" />

      <ScreenBody className="px-4 pt-3 pb-2">
        <p className="mb-4 text-[12.5px] leading-relaxed text-neutral-600">
          {expert.nickname} 님에게 보낼 정보예요.
          <br />
          자세할수록 답변이 정확해져요.
        </p>

        <Field label="어떤 자리인가요?" required>
          <div className="flex flex-wrap gap-2">
            {CONSULT_PURPOSES.map((p) => (
              <Chip key={p} selected={purpose === p} onClick={() => setPurpose(p)}>
                {p}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="예산" required>
          <div className="flex flex-wrap gap-2">
            {CONSULT_BUDGETS.map((b) => {
              const supported = b.label === CONSULT_BUDGET_SUPPORTED;
              return (
                <Chip
                  key={b.label}
                  selected={budget === b.label}
                  onClick={supported ? () => setBudget(b.label) : undefined}
                >
                  {b.label}
                  {!supported && " · 준비 중"}
                </Chip>
              );
            })}
          </div>
          <p className="mt-2 text-[11.5px] text-neutral-500">
            현재 {CONSULT_BUDGET_SUPPORTED} 예산만 지원해요.
          </p>
        </Field>

        <Field label="전신 사진" required>
          <p className="mb-2 text-[11.5px] leading-relaxed text-neutral-500">
            체형 판단과 최종 확정안 사이즈 산정에 쓰여요 · 최대 {PHOTO_MAX}장
            <br />
            <span className="font-semibold text-brand">얼굴은 가려도 괜찮아요</span>
            {" — "}모자이크·크롭한 사진도 컨설팅엔 충분해요.
          </p>
          <PhotoRow
            photos={bodyPhotos}
            alt="전신 사진"
            onPick={addPhoto(setBodyPhotos)}
          />
        </Field>

        <Field label="자주 입는 옷 사진">
          <p className="mb-2 text-[11.5px] text-neutral-500">
            지금 뭘 갖고 있는지 알면 겹치지 않게 골라드릴 수 있어요 · 선택
          </p>
          <PhotoRow
            photos={outfitPhotos}
            alt="착장 사진"
            onPick={addPhoto(setOutfitPhotos)}
          />
        </Field>

        <Field label="신경 쓰이는 부위">
          <div className="flex flex-wrap gap-2">
            {CONSULT_CONCERNS.map((c) => (
              <Chip
                key={c}
                selected={concerns.includes(c)}
                onClick={() => toggleConcern(c)}
              >
                {c}
              </Chip>
            ))}
          </div>
          <textarea
            value={bodyNote}
            onChange={(e) => setBodyNote(e.target.value)}
            rows={2}
            placeholder="어떤 부분이 신경 쓰이는지 적어주세요"
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2.5 text-[13px] leading-relaxed"
          />
        </Field>

        <Field label="원하는 스타일">
          <textarea
            value={styleNote}
            onChange={(e) => setStyleNote(e.target.value)}
            rows={3}
            placeholder="그 외에 고수에게 전하고 싶은 정보를 적어주세요"
            className="w-full rounded-md border border-neutral-300 px-3 py-2.5 text-[13px] leading-relaxed"
          />
        </Field>
      </ScreenBody>

      <BottomBar>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[12.5px] text-neutral-600">컨설팅비</span>
          <span className="cond text-[19px] font-bold">
            ₩{expert.price.toLocaleString("ko-KR")}
          </span>
        </div>
        <PrimaryButton
          disabled={!canSubmit}
          onClick={() => router.push("/booking/done/bk-2")}
        >
          ₩{expert.price.toLocaleString("ko-KR")} 결제하고 제출
        </PrimaryButton>
        <p className="mt-2 text-center text-[11.5px] text-neutral-500">
          {canSubmit
            ? `${CONSULTING_SLA_HOURS}시간 안에 답변 · 불만족 시 100% 환불`
            : "자리와 전신 사진을 채우면 신청할 수 있어요"}
        </p>
      </BottomBar>
    </AppShell>
  );
}

function PhotoRow({
  photos,
  alt,
  onPick,
}: {
  photos: string[];
  alt: string;
  onPick: (file: File) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((src, i) => (
        <PhotoBox
          key={i}
          src={src}
          alt={`${alt} ${i + 1}`}
          className="h-[64px] w-[64px]"
          marks={false}
        />
      ))}
      {photos.length < PHOTO_MAX && <PhotoSlot onPick={onPick} />}
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <p className="mb-2 flex items-center gap-1.5 text-[13.5px] font-bold">
        {label}
        {required && (
          <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
            필수
          </span>
        )}
      </p>
      {children}
    </section>
  );
}

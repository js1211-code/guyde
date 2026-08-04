"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Chip, PhotoBox, PhotoSlot } from "@/components/badge";
import {
  AppShell,
  BottomBar,
  PrimaryButton,
  ScreenBody,
  TopBar,
} from "@/components/shell";
import {
  BOOKING_PHOTO_MAX,
  CONSULT_BUDGET_NOTES,
  CONSULT_BUDGETS,
  CONSULT_CONCERNS,
  CONSULT_PURPOSES,
  CONSULTING_SLA_HOURS,
} from "@/lib/constants";
import { uploadImage } from "@/lib/api";
import {
  createBooking,
  fetchExpert,
  type ExpertDetail,
} from "@/lib/api/consulting-client";

/**
 * ⑯ 사전 설문.
 *
 * v2의 달력·시간 슬롯을 대체하는 화면이다. 고수가 답을 쓰려면 체형이 보여야
 * 하므로 전신 사진이 필수고, 없으면 신청 버튼이 열리지 않는다.
 *
 * "얼굴은 가려도 괜찮아요"를 사진 영역 바로 옆에 붙여둔다.
 * 사진 요구가 이 흐름의 최대 관문이라, 이 문구가 없으면 대부분 여기서 그만둔다.
 *
 * 예산은 15/20/25/30만원 네 가지다. 그 바깥을 왜 안 받는지도 같이 적는다 —
 * 이유 없이 선택지만 좁혀두면 "내 예산은 취급 안 하는구나"로만 읽힌다.
 */
export default function BookingSurveyPage({
  params,
}: {
  params: Promise<{ expertId: string }>;
}) {
  const { expertId } = use(params);
  const router = useRouter();

  const [expert, setExpert] = useState<ExpertDetail | null>(null);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const [bodyPhotos, setBodyPhotos] = useState<string[]>([]);
  const [outfitPhotos, setOutfitPhotos] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [bodyNote, setBodyNote] = useState("");
  const [styleNote, setStyleNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpert(expertId)
      .then(setExpert)
      .catch(() => setError("고수를 찾을 수 없어요"));
  }, [expertId]);

  const toggleConcern = (c: string) =>
    setConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  // 사진은 고를 때 바로 올린다. 제출 때 몰아서 올리면 몇 초씩 멈춘 것처럼 보인다.
  const addPhoto =
    (set: React.Dispatch<React.SetStateAction<string[]>>) => async (file: File) => {
      try {
        const url = await uploadImage(file);
        set((prev) => (prev.length >= BOOKING_PHOTO_MAX ? prev : [...prev, url]));
      } catch {
        setError("사진 업로드에 실패했어요");
      }
    };

  // 전신 사진이 없으면 고수가 판단할 근거 자체가 없다. 나머지는 없어도 답이 나온다.
  const canSubmit =
    Boolean(purpose) && budget !== null && bodyPhotos.length > 0 && !busy;

  async function submit() {
    if (!expert || !purpose || budget === null) return;
    setBusy(true);
    setError(null);
    try {
      const { id } = await createBooking({
        expert_id: expert.id,
        purpose,
        budget,
        concerns,
        body_note: bodyNote,
        style_note: styleNote,
        body_images: bodyPhotos,
        outfit_images: outfitPhotos,
      });
      router.push(`/booking/done/${id}`);
    } catch (e) {
      setError(e instanceof Error ? (e as { detail?: string }).detail ?? "신청에 실패했어요" : "신청에 실패했어요");
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <TopBar
        backHref={expert ? `/experts/${expert.id}` : "/experts"}
        title="사전 설문"
      />

      <ScreenBody className="px-4 pt-4 pb-2">
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
            {CONSULT_BUDGETS.map((b) => (
              <Chip key={b} selected={budget === b} onClick={() => setBudget(b)}>
                {b / 10000}만원
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-[11.5px] text-neutral-500">
            현재 {CONSULT_BUDGETS[0] / 10000}~
            {CONSULT_BUDGETS[CONSULT_BUDGETS.length - 1] / 10000}만원 예산만
            지원해요.
          </p>
          <ul className="mt-1.5 space-y-1">
            {CONSULT_BUDGET_NOTES.map((note) => (
              <li
                key={note}
                className="flex gap-1.5 text-[11.5px] leading-relaxed text-neutral-500"
              >
                <span aria-hidden="true">·</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </Field>

        <Field label="전신 사진" required>
          <p className="mb-2 text-[11.5px] leading-relaxed text-neutral-500">
            체형 판단과 최종 확정안 사이즈 산정에 쓰여요 · 최대{" "}
            {BOOKING_PHOTO_MAX}장
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

        {error && (
          <p className="mb-3 rounded-md bg-danger-tint px-3 py-2.5 text-[12.5px] text-danger">
            {error}
          </p>
        )}
      </ScreenBody>

      <BottomBar>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[12.5px] text-neutral-600">컨설팅비</span>
          <span className="cond text-[19px] font-bold">
            ₩{(expert?.price ?? 0).toLocaleString("ko-KR")}
          </span>
        </div>
        <PrimaryButton disabled={!canSubmit} onClick={submit}>
          {busy
            ? "신청하는 중…"
            : `₩${(expert?.price ?? 0).toLocaleString("ko-KR")} 결제하고 제출`}
        </PrimaryButton>
        <p className="mt-2 text-center text-[11.5px] text-neutral-500">
          {canSubmit
            ? `${CONSULTING_SLA_HOURS}시간 안에 답변 · 불만족 시 100% 환불`
            : "자리·예산·전신 사진을 채우면 신청할 수 있어요"}
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
          key={src}
          src={src}
          alt={`${alt} ${i + 1}`}
          className="h-[64px] w-[64px]"
          marks={false}
        />
      ))}
      {photos.length < BOOKING_PHOTO_MAX && <PhotoSlot onPick={onPick} />}
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

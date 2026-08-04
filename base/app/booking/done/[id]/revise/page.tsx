"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import {
  AppShell,
  BottomBar,
  PrimaryButton,
  ScreenBody,
  TopBar,
} from "@/components/shell";
import { REVISION_REASON_MIN } from "@/lib/constants";
import { sendFeedback } from "@/lib/api/consulting-client";

/**
 * ㉔ 수정 요청 사유 — 1회 한정.
 *
 * 사유를 필수로 받는 이유는 고수를 위해서다. "별로예요"만 오면 두 번째 답변도
 * 빗나가고, 그때는 남은 기회가 없다. 최소 글자수는 DB에서도 막고 있다
 * (feedbacks_reason_required) — 화면만 막으면 API로 우회된다.
 */
export default function RevisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enough = reason.trim().length >= REVISION_REASON_MIN;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await sendFeedback(id, "수정요청", reason.trim());
      router.push(`/booking/done/${id}`);
    } catch (e) {
      setError((e as { detail?: string }).detail ?? "요청을 보내지 못했어요");
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <TopBar backHref={`/booking/done/${id}`} title="수정 요청" />

      <ScreenBody className="px-4 pt-4">
        <div className="rounded-2xl bg-danger-tint p-4">
          <p className="text-[13px] font-bold text-danger">
            수정 요청은 1회만 가능해요
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-700">
            다음 답변이 확정안이 돼요. 어떤 점이 안 맞았는지 구체적으로 적을수록
            정확한 답이 옵니다.
          </p>
        </div>

        <p className="mt-5 mb-2 text-[13.5px] font-bold">
          무엇이 안 맞았나요?
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={6}
          autoFocus
          placeholder="예) 상의 색이 제 피부톤과 안 맞는 것 같아요. 조금 더 어두운 색이면 좋겠어요."
          className="w-full rounded-md border border-neutral-300 px-3 py-3 text-[13.5px] leading-relaxed"
        />
        <p
          className={`mt-1.5 text-right text-[11.5px] ${
            enough ? "text-neutral-500" : "text-danger"
          }`}
        >
          {reason.trim().length} / 최소 {REVISION_REASON_MIN}자
        </p>

        {error && (
          <p className="mt-3 rounded-md bg-danger-tint px-3 py-2.5 text-[12.5px] text-danger">
            {error}
          </p>
        )}
      </ScreenBody>

      <BottomBar>
        <PrimaryButton disabled={!enough || busy} onClick={submit}>
          {busy ? "보내는 중…" : "수정 요청 보내기"}
        </PrimaryButton>
      </BottomBar>
    </AppShell>
  );
}

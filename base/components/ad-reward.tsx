"use client";

import { useEffect, useState } from "react";
import { HeartIcon } from "@/components/icons";
import { apiFetch } from "@/lib/device";

type Status = { reward: number; limit: number; remaining: number };

/**
 * 광고 보고 하트 받기 (F-80).
 *
 * 광고 SDK는 붙이지 않았다 — 잠깐 "재생 중"을 보여주고 서버에 보상을 요청한다.
 * 상한은 서버가 잡으므로 여기서는 남은 횟수를 보여주기만 한다.
 */
export function AdReward({
  onGranted,
  compact = false,
}: {
  onGranted: (hearts: number, granted: number) => void;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/hearts/ad-reward")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStatus(d))
      .catch(() => {});
  }, []);

  const soldOut = status?.remaining === 0;

  async function watch() {
    setPlaying(true);
    setError(null);

    // 광고 재생 흉내 — 실제 SDK가 붙으면 이 자리에서 완료 콜백을 기다린다
    await new Promise((r) => setTimeout(r, 1800));

    try {
      const res = await apiFetch("/api/hearts/ad-reward", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.detail ?? "지금은 받을 수 없어요");
      } else {
        setStatus((s) => (s ? { ...s, remaining: body.remaining } : s));
        onGranted(body.hearts, body.granted);
      }
    } catch {
      setError("보상을 받지 못했어요");
    }
    setPlaying(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={watch}
        disabled={playing || soldOut}
        className={`flex w-full items-center justify-center gap-2 rounded-md border border-brand py-3 text-[14px] font-bold text-brand disabled:border-neutral-300 disabled:text-neutral-500 ${
          compact ? "py-2.5 text-[13px]" : ""
        }`}
      >
        <HeartIcon size={16} />
        {playing
          ? "광고 재생 중…"
          : soldOut
            ? "오늘은 다 받았어요"
            : `광고 보고 하트 ${status?.reward ?? ""}개 받기`}
      </button>

      {status && !soldOut && (
        <p className="mt-1.5 text-center text-[11.5px] text-neutral-600">
          {status.remaining}번 더 받을 수 있어요
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-center text-[11.5px] text-temp">{error}</p>
      )}
    </div>
  );
}

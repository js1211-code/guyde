"use client";

import { useEffect, useState } from "react";
import { DEVICE_KEY, getOrCreateDeviceId } from "@/lib/device";

/**
 * 기기 전환 (개발·데모 전용).
 *
 * 이 앱에는 로그인이 없다. 신원은 localStorage의 UUID 하나뿐이라,
 * "고수 입장에서 보기"를 하려면 그 UUID를 바꾸는 수밖에 없다.
 *
 * ⚠️ 제품 기능이 아니다. API에는 어떤 우회로도 만들지 않았다 —
 * 답변 작성은 여전히 담당 고수의 device_id로만 통과한다.
 * 여기서 하는 일은 "이 브라우저가 누구인 척할지"를 바꾸는 것뿐이고,
 * 시드 고수의 UUID가 공개된 데모 DB에서만 의미가 있다.
 * 실제 서비스에 이 화면을 남기면 안 된다. app/test 폴더째 지울 것.
 */

const SEED_EXPERTS = [
  { id: "00000000-0000-4000-8001-000000000001", label: "정갈한 여우 #4192 · 44.1°C" },
  { id: "00000000-0000-4000-8001-000000000002", label: "말쑥한 사슴 #4231 · 43.6°C" },
  { id: "00000000-0000-4000-8001-000000000003", label: "차분한 부엉이 #4774 · 42.9°C" },
  { id: "00000000-0000-4000-8001-000000000004", label: "말끔한 하마 #4455 · 42.5°C" },
];

/**
 * 고수로 바꾸기 직전의 내 UUID를 보관하는 자리.
 * 이게 없으면 되돌릴 때 새 UUID가 발급돼서, 방금 신청한 컨설팅이
 * 통째로 안 보이게 된다 — 데모 도중에 제일 당황스러운 지점이다.
 */
const PREV_KEY = "base.device_id.prev";

export default function DeviceSwitchPage() {
  const [current, setCurrent] = useState<string>("");
  const [prev, setPrev] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(getOrCreateDeviceId());
    setPrev(localStorage.getItem(PREV_KEY));
  }, []);

  function switchTo(id: string) {
    const now = localStorage.getItem(DEVICE_KEY);
    // 고수→고수로 옮길 때 원래 기기를 덮어쓰면 돌아갈 곳이 사라진다.
    if (now && !SEED_EXPERTS.some((e) => e.id === now)) {
      localStorage.setItem(PREV_KEY, now);
    }
    localStorage.setItem(DEVICE_KEY, id);
    // 화면 곳곳이 첫 렌더에서 기기 ID를 읽으므로 통째로 새로 고친다.
    window.location.href = "/consulting";
  }

  /** 고수로 바꾸기 전 쓰던 기기로 복귀. 신청한 컨설팅이 그대로 보인다. */
  function restore() {
    if (!prev) return;
    localStorage.setItem(DEVICE_KEY, prev);
    localStorage.removeItem(PREV_KEY);
    window.location.href = "/me/bookings";
  }

  function reset() {
    localStorage.removeItem(DEVICE_KEY);
    localStorage.removeItem(PREV_KEY);
    window.location.href = "/";
  }

  return (
    <main className="mx-auto max-w-md space-y-5 p-8">
      <div>
        <h1 className="text-2xl font-bold">기기 전환 (데모용)</h1>
        <p className="mt-2 text-sm text-neutral-600">
          로그인이 없는 앱이라 신원은 localStorage의 UUID 하나뿐이에요. 고수
          입장에서 답변을 써보려면 이 값을 시드 고수의 것으로 바꿉니다.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-300 p-4">
        <p className="text-xs font-semibold text-neutral-500">현재 기기</p>
        <p className="mt-1 font-mono text-xs break-all">{current || "…"}</p>
        {SEED_EXPERTS.some((e) => e.id === current) && (
          <p className="mt-2 text-xs font-bold text-amber-700">
            지금은 고수로 접속 중이에요
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">고수로 전환</p>
        {SEED_EXPERTS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => switchTo(e.id)}
            disabled={e.id === current}
            className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-left text-sm disabled:bg-neutral-100 disabled:text-neutral-400"
          >
            {e.label}
          </button>
        ))}
      </div>

      {prev && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">원래 기기로 돌아가기</p>
          <button
            type="button"
            onClick={restore}
            className="w-full rounded-lg bg-amber-700 px-4 py-3 text-sm font-bold text-white"
          >
            돌아가기 · 신청한 컨설팅 그대로
          </button>
          <p className="font-mono text-xs break-all text-neutral-500">{prev}</p>
        </div>
      )}

      <button
        type="button"
        onClick={reset}
        className="w-full rounded-lg bg-neutral-800 px-4 py-3 text-sm font-bold text-white"
      >
        완전 초기화 (새 UUID 발급)
      </button>

      <p className="text-xs leading-relaxed text-neutral-500">
        데모 순서: 일반 사용자로 컨설팅을 신청 → 여기서 고수로 전환해 답변 작성 →
        <strong>돌아가기</strong>로 복귀해 답변 확인.
        <br />
        <strong>완전 초기화</strong>는 새 UUID를 발급하므로 그 전에 신청한
        컨설팅과 쓴 글이 더 이상 보이지 않아요.
      </p>
    </main>
  );
}

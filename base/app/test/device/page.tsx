"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DEVICE_KEY,
  DEVICE_TAB_KEY,
  getOrCreateDeviceId,
} from "@/lib/device";

/**
 * 기기 전환 (개발·데모 전용).
 *
 * 이 앱에는 로그인이 없다. 신원은 localStorage의 UUID 하나뿐이라,
 * "고수 입장에서 보기"를 하려면 그 UUID를 바꾸는 수밖에 없다.
 *
 * 두 가지 방식이 있다.
 *   이 탭에서만  → sessionStorage. 탭마다 따로라 **일반과 고수를 동시에** 띄울 수 있다.
 *   브라우저 전체 → localStorage. 모든 탭이 같이 바뀐다.
 * 데모에서 두 화면을 나란히 보여줘야 하면 앞의 것을 쓴다.
 *
 * ⚠️ 제품 기능이 아니다. API에는 어떤 우회로도 만들지 않았다 —
 * 답변 작성은 여전히 담당 고수의 device_id로만 통과한다.
 * 여기서 하는 일은 "이 화면이 누구인 척할지"를 바꾸는 것뿐이고,
 * 시드 고수의 UUID가 공개된 데모 DB에서만 의미가 있다.
 * 실제 서비스에 이 화면을 남기면 안 된다. app/test 폴더째 지울 것.
 */

const SEED_EXPERTS = [
  { id: "00000000-0000-4000-8001-000000000001", label: "정갈한 여우 #4192 · 44.1°C" },
  { id: "00000000-0000-4000-8001-000000000002", label: "말쑥한 사슴 #4231 · 43.6°C" },
  { id: "00000000-0000-4000-8001-000000000003", label: "차분한 부엉이 #4774 · 42.9°C" },
  { id: "00000000-0000-4000-8001-000000000004", label: "말끔한 하마 #4455 · 42.5°C" },
];

/** 고수로 바꾸기 직전의 내 UUID. 되돌릴 때 신청한 컨설팅을 잃지 않으려고 보관한다. */
const PREV_KEY = "base.device_id.prev";

export default function DeviceSwitchPage() {
  return (
    <Suspense fallback={null}>
      <DeviceSwitch />
    </Suspense>
  );
}

function DeviceSwitch() {
  const params = useSearchParams();
  const [current, setCurrent] = useState("");
  const [prev, setPrev] = useState<string | null>(null);
  const [tabMode, setTabMode] = useState(false);

  // ?as=1~4 로 열면 그 탭만 고수가 된다. 데모용 북마크를 만들어두기 위한 것.
  useEffect(() => {
    const as = params.get("as");
    const picked = as ? SEED_EXPERTS[Number(as) - 1] : null;
    if (picked) {
      sessionStorage.setItem(DEVICE_TAB_KEY, picked.id);
      window.location.href = "/consulting";
      return;
    }
    setCurrent(getOrCreateDeviceId());
    setPrev(localStorage.getItem(PREV_KEY));
    setTabMode(sessionStorage.getItem(DEVICE_TAB_KEY) !== null);
  }, [params]);

  /** 이 탭만 고수로. 다른 탭은 그대로 일반 사용자다. */
  function switchTab(id: string) {
    sessionStorage.setItem(DEVICE_TAB_KEY, id);
    window.location.href = "/consulting";
  }

  /** 브라우저 전체를 고수로. 모든 탭이 같이 바뀐다. */
  function switchAll(id: string) {
    const now = localStorage.getItem(DEVICE_KEY);
    // 고수→고수로 옮길 때 원래 기기를 덮어쓰면 돌아갈 곳이 사라진다.
    if (now && !SEED_EXPERTS.some((e) => e.id === now)) {
      localStorage.setItem(PREV_KEY, now);
    }
    localStorage.setItem(DEVICE_KEY, id);
    sessionStorage.removeItem(DEVICE_TAB_KEY);
    window.location.href = "/consulting";
  }

  function clearTab() {
    sessionStorage.removeItem(DEVICE_TAB_KEY);
    window.location.href = "/";
  }

  function restore() {
    if (!prev) return;
    localStorage.setItem(DEVICE_KEY, prev);
    localStorage.removeItem(PREV_KEY);
    sessionStorage.removeItem(DEVICE_TAB_KEY);
    window.location.href = "/me/bookings";
  }

  function reset() {
    localStorage.removeItem(DEVICE_KEY);
    localStorage.removeItem(PREV_KEY);
    sessionStorage.removeItem(DEVICE_TAB_KEY);
    window.location.href = "/";
  }

  const isExpert = SEED_EXPERTS.some((e) => e.id === current);

  return (
    <main className="mx-auto max-w-md space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">기기 전환 (데모용)</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          로그인이 없는 앱이라 신원은 UUID 하나뿐이에요.{" "}
          <strong>이 탭에서만</strong> 바꾸면 다른 탭은 그대로라서, 일반 사용자와
          고수를 동시에 띄워둘 수 있어요.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-300 p-4">
        <p className="text-xs font-semibold text-neutral-500">현재 기기</p>
        <p className="mt-1 font-mono text-xs break-all">{current || "…"}</p>
        <p className="mt-2 text-xs font-bold">
          {isExpert ? (
            <span className="text-amber-700">
              고수로 접속 중{tabMode && " · 이 탭에서만"}
            </span>
          ) : (
            <span className="text-neutral-600">일반 사용자</span>
          )}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">이 탭에서만 고수로 (권장)</p>
        <p className="text-xs text-neutral-500">
          다른 탭은 계속 일반 사용자예요. 데모에서 두 화면을 나란히 놓을 때 쓰세요.
        </p>
        {SEED_EXPERTS.map((e, i) => (
          <button
            key={e.id}
            type="button"
            onClick={() => switchTab(e.id)}
            className="block w-full rounded-lg border border-amber-700 px-4 py-3 text-left text-sm font-semibold text-amber-800"
          >
            {e.label}
            <span className="ml-2 font-mono text-xs text-neutral-500">?as={i + 1}</span>
          </button>
        ))}
        {tabMode && (
          <button
            type="button"
            onClick={clearTab}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm"
          >
            이 탭을 일반 사용자로 되돌리기
          </button>
        )}
      </div>

      <details className="rounded-lg border border-neutral-200 p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          브라우저 전체를 바꾸기
        </summary>
        <p className="mt-2 text-xs text-neutral-500">
          모든 탭이 같이 바뀝니다. 한 화면만 보여줄 때 쓰세요.
        </p>
        <div className="mt-3 space-y-2">
          {SEED_EXPERTS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => switchAll(e.id)}
              disabled={e.id === current && !tabMode}
              className="block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-left text-sm disabled:bg-neutral-100 disabled:text-neutral-400"
            >
              {e.label}
            </button>
          ))}
        </div>

        {prev && (
          <button
            type="button"
            onClick={restore}
            className="mt-3 w-full rounded-lg bg-amber-700 px-4 py-3 text-sm font-bold text-white"
          >
            원래 기기로 돌아가기 · 신청한 컨설팅 그대로
          </button>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-2 w-full rounded-lg bg-neutral-800 px-4 py-2.5 text-sm font-bold text-white"
        >
          완전 초기화 (새 UUID 발급)
        </button>
      </details>

      <div className="rounded-lg bg-neutral-100 p-4 text-xs leading-relaxed text-neutral-600">
        <p className="mb-2 font-bold text-neutral-800">데모 준비</p>
        탭 A는 <code>localhost:3000</code> (일반 사용자)
        <br />
        탭 B는 <code>localhost:3000/test/device?as=1</code> (정갈한 여우 고수)
        <br />
        <span className="text-neutral-500">
          탭 B는 새 탭을 열어 주소를 직접 입력하세요. 탭을 복제하면
          sessionStorage까지 복사돼서 둘 다 고수가 됩니다.
        </span>
      </div>
    </main>
  );
}

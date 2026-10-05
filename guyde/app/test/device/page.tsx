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
 * 고수 신원은 **sessionStorage(탭 단위)에만** 둔다. localStorage에 박으면
 * localhost:3000을 그냥 열어도 고수로 떠서, 왜 그런지 알 수 없는 상태가 된다.
 * 실제로 그 함정을 밟아서 브라우저 전체를 바꾸는 경로를 없앴다.
 * 덕분에 일반 사용자와 고수를 두 탭에 동시에 띄울 수 있다.
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

  /**
   * 일반 사용자로 복귀.
   *
   * 고수 신원은 이제 sessionStorage(탭)에만 둔다. localStorage에 고수가 박히면
   * localhost:3000을 그냥 열어도 고수로 떠서, 왜 그런지 알 수 없는 상태가 된다.
   * 예전 방식으로 박아둔 값이 남아 있을 수 있으니 여기서 걷어낸다.
   */
  function restore() {
    sessionStorage.removeItem(DEVICE_TAB_KEY);
    if (prev) {
      localStorage.setItem(DEVICE_KEY, prev);
      localStorage.removeItem(PREV_KEY);
    } else {
      // 돌아갈 기기가 없으면 새로 발급받는 수밖에 없다.
      localStorage.removeItem(DEVICE_KEY);
    }
    window.location.href = prev ? "/me/bookings" : "/";
  }

  function clearTab() {
    sessionStorage.removeItem(DEVICE_TAB_KEY);
    window.location.href = "/";
  }

  function reset() {
    localStorage.removeItem(DEVICE_KEY);
    localStorage.removeItem(PREV_KEY);
    sessionStorage.removeItem(DEVICE_TAB_KEY);
    window.location.href = "/";
  }

  const isExpert = SEED_EXPERTS.some((e) => e.id === current);
  // localStorage 자체가 고수인 상태 — 새 탭을 열어도 고수로 뜬다.
  const stuckAsExpert = isExpert && !tabMode;

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
        <p className="text-sm font-semibold">이 탭에서만 고수로</p>
        <p className="text-xs leading-relaxed text-neutral-500">
          다른 탭은 계속 일반 사용자예요. 고수 신원은 이 탭에만 남으므로
          <code>localhost:3000</code>은 언제나 일반 사용자로 열립니다.
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

      {stuckAsExpert && (
        <div className="rounded-lg border-2 border-amber-700 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">
            브라우저 전체가 고수로 고정돼 있어요
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-900">
            이 상태면 <code>localhost:3000</code>을 그냥 열어도 고수로 뜹니다.
            아래를 눌러 일반 사용자로 되돌리세요.
          </p>
          <button
            type="button"
            onClick={restore}
            className="mt-3 w-full rounded-lg bg-amber-700 px-4 py-3 text-sm font-bold text-white"
          >
            일반 사용자로 되돌리기
            {prev && " · 신청한 컨설팅 그대로"}
          </button>
        </div>
      )}

      <details className="rounded-lg border border-neutral-200 p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          기기 초기화
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          새 UUID를 발급합니다. 그 전에 쓴 글·댓글과 신청한 컨설팅이 더 이상
          보이지 않아요.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-3 w-full rounded-lg bg-neutral-800 px-4 py-2.5 text-sm font-bold text-white"
        >
          완전 초기화
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

"use client";

/**
 * F-01 기기 UUID — 이 앱의 유일한 신원.
 * 최초 진입 시 UUID v4를 만들어 localStorage에 저장하고, 이후로는 재사용한다.
 * 온보딩·로그인 화면이 없으므로 진입과 동시에 조용히 발급된다.
 */

export const DEVICE_KEY = "base.device_id";

/**
 * 탭 단위 신원 덮어쓰기 — 데모 전용.
 *
 * localStorage는 브라우저 전체가 공유해서 한 번에 한 사람만 될 수 있다.
 * sessionStorage는 **탭마다 따로**라, 여기에 값이 있으면 그 탭만 다른 사람이 된다.
 * 덕분에 한 브라우저에서 왼쪽 탭은 일반 사용자, 오른쪽 탭은 고수로 띄워둘 수 있다.
 *
 * 이건 화면이 "누구인 척할지"를 정하는 것뿐이고 서버 검증은 그대로다 —
 * 답변 작성은 여전히 담당 고수의 device_id로만 통과한다.
 * 실서비스에서는 app/test와 함께 이 개념도 지운다.
 */
export const DEVICE_TAB_KEY = "base.device_id.tab";

function tabOverride(): string | null {
  try {
    return sessionStorage.getItem(DEVICE_TAB_KEY);
  } catch {
    return null; // 사파리 프라이빗 등에서 sessionStorage가 막힐 수 있다
  }
}

/** 최초 실행인지 판별한다 — 닉네임 발급 화면을 한 번만 보여주기 위해. */
export function hasDeviceId(): boolean {
  // 탭 덮어쓰기로 들어온 사람에게 "새 닉네임을 발급했어요"를 보여주면 안 된다.
  return tabOverride() !== null || localStorage.getItem(DEVICE_KEY) !== null;
}

export function getOrCreateDeviceId(): string {
  const override = tabOverride();
  if (override) return override;

  const stored = localStorage.getItem(DEVICE_KEY);
  if (stored) return stored;

  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_KEY, id);
  return id;
}

/**
 * F-04 모든 API 요청에 X-Device-Id를 실어 보낸다.
 * 서버는 이 헤더만으로 작성자·투표자를 판별한다.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": getOrCreateDeviceId(),
      ...init.headers,
    },
  });
}

/** 앱 진입 시 한 번 호출 — 없으면 유저를 만들고 있으면 기존 유저를 받는다(F-02). */
export async function registerDevice() {
  const res = await apiFetch("/api/users/register", { method: "POST" });
  if (!res.ok) throw new Error(`register failed: ${res.status}`);
  return res.json() as Promise<{
    device_id: string;
    nickname: string;
    temperature: number;
    hearts: number;
  }>;
}

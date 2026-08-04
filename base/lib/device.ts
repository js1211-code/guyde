"use client";

/**
 * F-01 기기 UUID — 이 앱의 유일한 신원.
 * 최초 진입 시 UUID v4를 만들어 localStorage에 저장하고, 이후로는 재사용한다.
 * 온보딩·로그인 화면이 없으므로 진입과 동시에 조용히 발급된다.
 */

export const DEVICE_KEY = "base.device_id";

/** 최초 실행인지 판별한다 — 닉네임 발급 화면을 한 번만 보여주기 위해. */
export function hasDeviceId(): boolean {
  return localStorage.getItem(DEVICE_KEY) !== null;
}

export function getOrCreateDeviceId(): string {
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

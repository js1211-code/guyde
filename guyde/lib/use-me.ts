"use client";

import { useEffect, useState } from "react";
import { apiFetch, hasDeviceId, registerDevice } from "@/lib/device";

export type Me = {
  device_id: string;
  nickname: string;
  temperature: number;
  /**
   * 고수 계정인지. 고수도 커뮤니티·도서관·내정보를 똑같이 쓴다 —
   * 다른 건 컨설팅 탭이 신청 화면 대신 받은 신청함으로 간다는 것뿐이다.
   */
  is_expert: boolean;
};

/**
 * 앱 진입 시 기기를 등록하고 내 정보를 들고 있는다.
 * 로그인이 없으므로 이게 사실상의 세션이다(F-01·F-02).
 *
 * isFirstRun: localStorage에 device_id가 없던 첫 진입 → 닉네임 발급 화면을 한 번 보여준다.
 */
export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [isFirstRun, setFirstRun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const first = !hasDeviceId();
    registerDevice()
      .then((user) => {
        setMe(user);
        setFirstRun(first);
      })
      .catch((e) => setError(String(e)));
  }, []);

  async function rerollNickname() {
    const res = await apiFetch("/api/users/nickname", { method: "POST" });
    if (!res.ok) return;
    const { nickname } = await res.json();
    setMe((prev) => (prev ? { ...prev, nickname } : prev));
  }

  async function renameNickname(nickname: string) {
    const res = await apiFetch("/api/users/nickname", {
      method: "PATCH",
      body: JSON.stringify({ nickname }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "RENAME_FAILED");
    }
    setMe((prev) => (prev ? { ...prev, nickname } : prev));
  }

  return {
    me,
    isFirstRun,
    error,
    dismissFirstRun: () => setFirstRun(false),
    rerollNickname,
    renameNickname,
  };
}

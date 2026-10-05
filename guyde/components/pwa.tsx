"use client";

import { useEffect } from "react";

/**
 * 서비스 워커 등록.
 *
 * 개발 중에는 등록하지 않는다 — 워커가 살아 있으면 HMR로 바뀐 파일 대신
 * 캐시가 나가서, 고쳤는데 화면이 안 바뀌는 상황을 계속 만든다.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // 등록 실패해도 앱은 그대로 돌아간다. 설치형만 안 될 뿐이다.
    });
  }, []);

  return null;
}

"use client";

import { useEffect, useState } from "react";

/**
 * ⚠️ 진단 전용 화면 · 원인을 잡고 나면 이 폴더째 지운다(app/test와 함께).
 *
 * 데스크톱 브라우저로는 iOS의 안전 영역과 고무줄 바운스를 재현할 수 없어서,
 * 탭바 밑에 남는 공백이 무엇 때문인지 추측으로 두 번 고쳤다. 추측을 끝내려면
 * 실제 기기에서 나오는 숫자를 봐야 한다.
 *
 * 이 화면은 셸을 쓰지 않고 같은 구조(fixed inset-0 + 하단 바)만 흉내 낸 뒤,
 * 화면 끝과 바의 끝이 실제로 몇 px 떨어져 있는지 그대로 보여준다.
 */
export default function DiagPage() {
  const [v, setV] = useState<Record<string, string | number> | null>(null);

  useEffect(() => {
    const read = () => {
      const box = document.getElementById("diag-shell")!.getBoundingClientRect();
      const bar = document.getElementById("diag-bar")!.getBoundingClientRect();
      const probe = document.getElementById("diag-probe")!;
      const cs = getComputedStyle(probe);

      setV({
        "window.innerHeight": window.innerHeight,
        "visualViewport.height": Math.round(window.visualViewport?.height ?? -1),
        "screen.height": window.screen.height,
        "documentElement.clientHeight": document.documentElement.clientHeight,
        "safe-top (env)": cs.paddingTop,
        "safe-bottom (env)": cs.paddingBottom,
        "셸 top": Math.round(box.top),
        "셸 bottom": Math.round(box.bottom),
        "셸 높이": Math.round(box.height),
        "바 bottom": Math.round(bar.bottom),
        "★ 바 밑 빈 공간": Math.round(window.innerHeight - bar.bottom),
        "★ 셸 밑 빈 공간": Math.round(window.innerHeight - box.bottom),
        standalone: String(
          window.matchMedia("(display-mode: standalone)").matches,
        ),
        "문서 넘침": document.documentElement.scrollHeight - window.innerHeight,
        // 어느 값이 '진짜 화면 높이'인지 갈라준다. 셸을 무엇에 맞춰야 하는지가
        // 여기서 정해진다 — innerHeight가 짧으면 fixed inset-0으로는 못 채운다.
        "▶ screen−inner": window.screen.height - window.innerHeight,
        "▶ 판정":
          window.innerHeight >= window.screen.height - 2
            ? "innerHeight = 전체화면 (fixed로 충분)"
            : `innerHeight가 ${window.screen.height - window.innerHeight}px 짧음 (다른 기준 필요)`,
      });
    };

    read();
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    window.visualViewport?.addEventListener("scroll", read);
    const timer = setInterval(read, 500);
    return () => {
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("scroll", read);
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      {/* 셸 바깥. 셸이 화면 끝까지 안 닿으면 이 회색이 드러난다. */}
      <div className="fixed inset-0 bg-neutral-400" />

      {/* env()의 실제 값을 읽어내기 위한 보이지 않는 자 */}
      <div
        id="diag-probe"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 1,
          height: 1,
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          visibility: "hidden",
        }}
      />

      {/* 실제 셸과 같은 구조 */}
      <div
        id="diag-shell"
        className="fixed inset-0 mx-auto flex w-full max-w-[430px] flex-col overflow-hidden bg-paper pt-[var(--safe-top)] text-ink"
      >
        {/* 화면 맨 위·맨 아래를 눈으로 확인할 빨간 선 */}
        <div className="h-[3px] shrink-0" style={{ background: "#e11" }} />

        <main className="scroll-area min-h-0 flex-1 px-3 py-2">
          <p className="mb-2 text-[13px] font-bold">진단값</p>
          {v &&
            Object.entries(v).map(([k, val]) => (
              <p
                key={k}
                className={`flex justify-between border-b border-neutral-300 py-1 text-[12px] ${
                  k.startsWith("★") || k.startsWith("▶") ? "font-bold text-danger" : ""
                }`}
              >
                <span>{k}</span>
                <span className="font-mono">{String(val)}</span>
              </p>
            ))}
          <p className="mt-3 text-[11.5px] leading-relaxed text-neutral-600">
            아래 파란 바가 <b>탭바 자리</b>예요. 파란 바 밑에 회색이 보이면 그만큼
            공백이 남은 거고, 안 보이면 화면 끝까지 닿은 거예요.
          </p>
        </main>

        {/* 탭바와 같은 규칙 */}
        <nav
          id="diag-bar"
          className="shrink-0 border-t border-neutral-400 bg-brand px-2 pt-2 pb-[max(0.25rem,var(--safe-bottom))] text-center text-[12px] font-bold text-white"
        >
          여기가 탭바 (파란 바)
          <div className="mt-1 h-[3px]" style={{ background: "#e11" }} />
        </nav>
      </div>
    </>
  );
}

"use client";

import { PrimaryButton } from "@/components/shell";
import { RefreshIcon } from "@/components/icons";
import { Reg } from "@/components/reg";
import { Temperature } from "@/components/temperature";
import { TEMP_START } from "@/lib/constants";

/**
 * 최초 실행 — 이 기기에 발급된 닉네임을 한 번 보여준다.
 * 로그인·회원가입이 아니다. 이미 발급은 끝났고 확인만 시키는 화면이라
 * 두 번째 진입부터는 뜨지 않는다(F-01: 온보딩 없음, 진입 즉시 피드).
 */
export function FirstRun({
  nickname,
  onReroll,
  onStart,
}: {
  nickname: string;
  onReroll: () => void;
  onStart: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-paper">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="cond mb-8 text-[26px] font-bold tracking-[0.14em]">BASE</p>
        <p className="text-[13px] text-neutral-600">
          이 기기에 새 닉네임을 발급했어요
        </p>

        <div className="relative mt-5 w-full border border-neutral-400 px-6 py-6">
          <Reg corners="tl tr bl br" />
          <p className="text-[21px] font-bold">{nickname}</p>
          <p className="mt-2.5 flex items-center justify-center gap-1.5">
            <span className="text-[12px] text-neutral-600">시작 온도</span>
            <Temperature value={TEMP_START} size={16} />
          </p>
        </div>

        <button
          type="button"
          onClick={onReroll}
          className="mt-3 flex items-center justify-center gap-1 text-brand"
        >
          <RefreshIcon size={14} />
          <span className="cond text-[13px] font-bold">닉네임 다시 뽑기</span>
        </button>

        <p className="mt-4 text-[12.5px] leading-relaxed text-neutral-600">
          글도 댓글도 이 닉네임과 온도로 표시돼요.
          <br />
          다른 사람에게는 닉네임 뒤 숫자로만 구분됩니다.
        </p>
      </div>

      <div className="px-6 pt-2 pb-4">
        <PrimaryButton onClick={onStart}>시작하기</PrimaryButton>
      </div>
    </div>
  );
}

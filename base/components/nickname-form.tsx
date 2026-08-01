"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertIcon, HeartIcon } from "@/components/icons";
import { NICKNAME_MAX_LENGTH, SIGNUP_BONUS_HEARTS } from "@/lib/constants";

/** users.nickname은 unique라 중복 검사가 필요하다. 지금은 목록으로 흉내만 낸다. */
const TAKEN = ["미니멀준", "데일리베이직", "옷잘입고싶은곰"];

export function NicknameForm() {
  const [nickname, setNickname] = useState("미니멀준");

  const taken = TAKEN.includes(nickname.trim());
  const valid = nickname.trim().length > 0 && !taken;

  return (
    <>
      <div className="flex-1 px-6 pt-6">
        <p className="cond text-[12px] tracking-[0.14em] text-neutral-600">
          STEP 1 / 1
        </p>
        <h1 className="mt-2 text-[24px] font-bold">뭐라고 부를까요?</h1>
        <p className="mt-1.5 text-[14px] text-neutral-600">
          답변할 때 닉네임과 온도만 보여요
        </p>

        <div className="mt-8">
          <div
            className={`flex h-12 items-center border px-3.5 ${
              taken ? "border-temp-hot" : "border-neutral-500"
            }`}
          >
            <input
              value={nickname}
              maxLength={NICKNAME_MAX_LENGTH}
              onChange={(e) => setNickname(e.target.value)}
              aria-label="닉네임"
              aria-invalid={taken}
              className="w-full text-[16px] font-medium"
            />
            <span className="cond ml-auto shrink-0 pl-2 text-[12px] text-neutral-600">
              {nickname.length}/{NICKNAME_MAX_LENGTH}
            </span>
          </div>

          {taken && (
            <p className="mt-1.5 flex items-center gap-1 text-[12px] text-temp-hot">
              <AlertIcon size={13} />
              이미 있는 닉네임이에요
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3 border border-accent-200 bg-accent-100 p-3.5">
          <HeartIcon size={20} className="shrink-0 text-accent-700" />
          <div className="flex-1">
            <p className="text-[13.5px] font-semibold">
              가입하면 하트 {SIGNUP_BONUS_HEARTS}개를 드려요
            </p>
            <p className="mt-0.5 text-[12px] text-neutral-600">
              하트 1개로 질문 1개를 올릴 수 있어요
            </p>
          </div>
          <span className="cond text-[22px] font-bold text-accent-700">
            ×{SIGNUP_BONUS_HEARTS}
          </span>
        </div>
      </div>

      <div className="px-6 pb-6">
        {valid ? (
          <Link
            href="/"
            className="flex h-12 items-center justify-center bg-accent text-[15px] font-bold text-white"
          >
            시작하기
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex h-12 w-full items-center justify-center bg-neutral-400 text-[15px] font-bold text-white"
          >
            시작하기
          </button>
        )}
      </div>
    </>
  );
}

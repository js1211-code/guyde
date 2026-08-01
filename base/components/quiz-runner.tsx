"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckIcon, ChevronLeftIcon, CloseIcon, UsersIcon } from "@/components/icons";
import { QUIZ_QUESTION_COUNT } from "@/lib/constants";
import { quizChoices, quizQuestions } from "@/lib/mock";

/**
 * 유형테스트. 인트로(디자인 08)와 문항(디자인 09)이 한 라우트 안에서 넘어간다.
 * IA에 /quiz 하나만 있어서 진행 상태는 클라이언트에 둔다.
 */
export function QuizRunner({
  takerCount,
  resultId,
}: {
  takerCount: number;
  resultId: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(-1); // -1 = 인트로
  const [answers, setAnswers] = useState<number[]>([]);

  if (step < 0) {
    return <Intro takerCount={takerCount} onStart={() => setStep(0)} />;
  }

  const question = quizQuestions[step];
  const progress = ((step + 1) / QUIZ_QUESTION_COUNT) * 100;

  function choose(choiceIndex: number) {
    const next = [...answers];
    next[step] = choiceIndex;
    setAnswers(next);

    if (step + 1 >= QUIZ_QUESTION_COUNT) {
      router.push(`/quiz/result/${resultId}`);
    } else {
      setStep(step + 1);
    }
  }

  return (
    <>
      <header className="flex items-center justify-between px-4 py-2">
        <Link href="/" aria-label="닫기">
          <CloseIcon size={20} />
        </Link>
        <span className="cond text-[14px] tracking-[0.1em] text-neutral-600">
          {String(step + 1).padStart(2, "0")} /{" "}
          {String(QUIZ_QUESTION_COUNT).padStart(2, "0")}
        </span>
      </header>

      <div className="mt-1 px-4">
        <div className="relative h-2 border border-neutral-400">
          <div
            className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 px-6 pt-10">
        <p className="cond text-[13px] tracking-[0.14em] text-accent-700">
          Q{step + 1}
        </p>
        <h1 className="mt-2 text-[23px] leading-snug font-bold whitespace-pre-line">
          {question.text}
        </h1>

        <div className="mt-9 flex flex-col gap-2">
          {quizChoices.map((choice, i) => {
            const selected = answers[step] === i;
            return (
              <button
                key={choice}
                type="button"
                onClick={() => choose(i)}
                aria-pressed={selected}
                className={`flex h-[54px] items-center justify-between px-4 text-[15px] ${
                  selected
                    ? "bg-accent font-bold text-white"
                    : "border border-neutral-400 text-neutral-600"
                }`}
              >
                {choice}
                {selected && <CheckIcon size={16} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-6">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 text-[13.5px] font-semibold text-neutral-600"
          >
            <ChevronLeftIcon size={14} />
            이전 문항
          </button>
        )}
      </div>
    </>
  );
}

function Intro({
  takerCount,
  onStart,
}: {
  takerCount: number;
  onStart: () => void;
}) {
  return (
    <>
      <header className="flex items-center px-4 py-2">
        <Link href="/" aria-label="닫기">
          <CloseIcon size={20} />
        </Link>
      </header>

      <div className="flex flex-1 flex-col justify-center px-7">
        <p className="cond text-[13px] tracking-[0.16em] text-accent-700">
          BASE LEVEL TEST
        </p>
        <h1 className="mt-3 text-[28px] leading-tight font-bold">
          내 자기관리,
          <br />
          지금 몇 점?
        </h1>
        <p className="mt-3 text-[15px] text-neutral-600">
          1분, {QUIZ_QUESTION_COUNT}문항으로 알아보는 내 베이스 레벨
        </p>

        <div className="mt-8 border border-neutral-500 p-4">
          <div className="flex items-center gap-4">
            <span className="cond text-[36px] leading-none font-bold text-accent-700">
              {QUIZ_QUESTION_COUNT}
            </span>
            <span className="text-[12px] leading-snug text-neutral-600">
              문항
              <br />
              <span className="cond tracking-wide">QUESTIONS</span>
            </span>
            <span className="h-8 w-px bg-neutral-400" />
            <span className="cond text-[36px] leading-none font-bold text-accent-700">
              1<span className="text-[20px]">분</span>
            </span>
            <span className="text-[12px] leading-snug text-neutral-600">
              소요
              <br />
              <span className="cond tracking-wide">MINUTE</span>
            </span>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-[12.5px] text-neutral-600">
          <UsersIcon size={13} />
          <span className="cond font-semibold">
            {takerCount.toLocaleString("ko-KR")}
          </span>
          명이 확인했어요
        </p>
      </div>

      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={onStart}
          className="flex h-12 w-full items-center justify-center bg-accent text-[15px] font-bold text-white"
        >
          시작하기
        </button>
        <p className="mt-3 text-center text-[11.5px] text-neutral-600">
          로그인 없이 바로 할 수 있어요
        </p>
      </div>
    </>
  );
}

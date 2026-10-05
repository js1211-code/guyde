"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell, BottomBar, Kicker, ScreenBody, TopBar } from "@/components/shell";
import { scoreQuiz, type Quiz, type QuizResult } from "@/lib/mock";

/**
 * ⑬ 테스트 — 문항을 풀고 결과를 본다.
 *
 * 한 화면 안에서 문항 → 결과로 넘어간다. 결과를 별도 라우트로 두면 주소가
 * 남아서 문항을 건너뛰고 결과부터 볼 수 있고, 뒤로가기로 돌아왔을 때
 * 고른 답이 사라진다.
 *
 * 답을 고르면 곧바로 다음 문항으로 넘어간다 — 문항이 4개뿐이라 "다음" 버튼을
 * 따로 누르게 하면 탭 수가 두 배가 된다.
 */
export function QuizRunner({
  quiz,
  results,
}: {
  quiz: Quiz;
  results: Record<string, QuizResult>;
}) {
  const [picks, setPicks] = useState<number[]>([]);

  const step = picks.length;
  const done = step >= quiz.questions.length;
  const result = done ? results[scoreQuiz(quiz, picks)] : null;

  if (!done) {
    const q = quiz.questions[step];
    return (
      <AppShell>
        <TopBar
          // 첫 문항에서는 도서관으로, 그 뒤로는 직전 문항으로 되돌린다.
          title="TEST"
        />

        <ScreenBody className="px-4 pt-5">
          <div className="flex items-center justify-between">
            <Kicker>{quiz.title}</Kicker>
            <span className="cond text-[13px] font-semibold text-neutral-600">
              {step + 1} / {quiz.questions.length}
            </span>
          </div>

          <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300"
              style={{ width: `${(step / quiz.questions.length) * 100}%` }}
            />
          </div>

          <p className="mt-6 text-[18.5px] leading-snug font-bold">{q.q}</p>

          <div className="mt-4 flex flex-col gap-2.5">
            {q.options.map((opt, i) => (
              <button
                key={opt.text}
                type="button"
                onClick={() => setPicks([...picks, i])}
                className="rounded-xl border border-neutral-400 px-4 py-3.5 text-left text-[15px] transition-colors active:bg-brand/15"
              >
                {opt.text}
              </button>
            ))}
          </div>
        </ScreenBody>

        <BottomBar bordered={false}>
          {step === 0 ? (
            <Link
              href="/library"
              className="block py-2 text-center text-[14px] text-neutral-600"
            >
              그만두기
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setPicks(picks.slice(0, -1))}
              className="w-full py-2 text-center text-[14px] text-neutral-600"
            >
              이전 문항
            </button>
          )}
        </BottomBar>
      </AppShell>
    );
  }

  if (!result) return null;

  return (
    <AppShell>
      <TopBar backHref="/library" title="TEST RESULT" />

      <ScreenBody className="px-4 pt-6 text-center">
        <Kicker>{result.quiz_title}</Kicker>

        <div className="mt-3 rounded-xl border border-neutral-400 px-4 py-6">
          <p className="cond text-[32.5px] leading-tight font-bold text-brand">
            {result.result_type}
          </p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-700">
            {result.description}
          </p>
        </div>

        <div className="mt-5 text-left">
          <div className="mb-1.5 flex items-center justify-between text-[13px] font-semibold">
            <span className="text-neutral-600">같은 결과</span>
            <span className="text-brand">상위 {result.top_percent}%</span>
          </div>
          <div className="h-[10px] overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-brand"
              style={{ width: `${result.top_percent}%` }}
            />
          </div>
        </div>

        <div className="mt-5 text-left">
          <Kicker className="mb-2 text-[12px]">RECOMMENDED</Kicker>
          {result.recommendations.map((r, i) => (
            <p
              key={r}
              className={`flex items-center gap-2 border-t border-dashed border-neutral-400 py-2.5 ${
                i === result.recommendations.length - 1
                  ? "border-b border-dashed border-neutral-400"
                  : ""
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-brand text-[12px] font-bold text-white">
                {i + 1}
              </span>
              <span className="text-[14.5px]">{r}</span>
            </p>
          ))}
        </div>
      </ScreenBody>

      <BottomBar bordered={false}>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setPicks([])}
            className="rounded-md border border-neutral-400 py-3 text-center text-[15px] font-bold"
          >
            다시 하기
          </button>
          <Link
            href="/write"
            className="rounded-md bg-brand py-3 text-center text-[15px] font-bold text-white"
          >
            커뮤니티에서 검증받기
          </Link>
        </div>
      </BottomBar>
    </AppShell>
  );
}

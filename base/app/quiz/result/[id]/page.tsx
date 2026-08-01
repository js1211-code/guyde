import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, Kicker, ScreenBody } from "@/components/app-shell";
import { CloseIcon, ShareIcon } from "@/components/icons";
import { getQuizResult, getQuizResultIds } from "@/lib/mock";

export function generateStaticParams() {
  return getQuizResultIds().map((id) => ({ id }));
}

export default async function QuizResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = getQuizResult(id);
  if (!result) notFound();

  return (
    <AppShell>
      <header className="flex items-center justify-end px-4 py-2">
        <Link href="/" aria-label="닫기">
          <CloseIcon size={20} />
        </Link>
      </header>

      <ScreenBody className="px-6 pt-2">
        <Kicker className="tracking-[0.16em]">MY BASE TYPE</Kicker>

        <div className="mt-2 border border-accent bg-accent-100 px-4 py-5">
          <h1 className="text-[30px] leading-none font-bold">
            {result.result_type}
          </h1>
          <p className="mt-2.5 text-[13.5px] leading-relaxed whitespace-pre-line text-neutral-600">
            {result.description}
          </p>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between text-[12.5px]">
            <span className="text-neutral-600">같은 유형 중</span>
            <span className="cond text-[15px] font-bold text-accent-700">
              TOP {result.top_percent}%
            </span>
          </div>
          <div className="relative mt-1.5 h-2.5 border border-neutral-400">
            <div className="hatch absolute inset-0" />
            <div
              className="absolute inset-y-0 left-0 bg-accent"
              style={{ width: `${result.top_percent}%` }}
            />
          </div>
        </div>

        <Kicker className="mt-6 mb-2">당신의 첫 베이스 3가지</Kicker>
        <ol className="flex flex-col">
          {result.starters.map((s, i) => (
            <li
              key={s.title}
              className={`flex items-center gap-2.5 py-2.5 ${
                i < result.starters.length - 1
                  ? "border-b border-dashed border-neutral-400"
                  : ""
              }`}
            >
              <span className="cond flex h-5 w-5 shrink-0 items-center justify-center border border-accent text-[11px] font-bold text-accent-700">
                {i + 1}
              </span>
              <span className="text-[14.5px] font-medium">{s.title}</span>
              <span className="ml-auto text-[12px] text-neutral-600">
                {s.hint}
              </span>
            </li>
          ))}
        </ol>
      </ScreenBody>

      <div className="flex flex-col gap-2 px-6 pt-2 pb-6">
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-1.5 border border-ink text-[14px] font-semibold"
        >
          <ShareIcon size={14} />
          결과 공유하기
        </button>
        <Link
          href="/"
          className="flex h-12 items-center justify-center bg-accent text-[15px] font-bold text-white"
        >
          BASE에서 검증받기
        </Link>
      </div>
    </AppShell>
  );
}

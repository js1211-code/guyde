import Link from "next/link";
import { notFound } from "next/navigation";
import { Reg } from "@/components/reg";
import { AppShell, BottomBar, Kicker, ScreenBody, TopBar } from "@/components/shell";
import { getQuizResult, getQuizSlugs } from "@/lib/mock";

export function generateStaticParams() {
  return getQuizSlugs().map((slug) => ({ slug }));
}

/** ⑬ 테스트 결과 — 결과를 보고 커뮤니티로 넘어가는 게 이 화면의 목적 */
export default async function QuizResultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = getQuizResult(slug);
  if (!result) notFound();

  return (
    <AppShell>
      <TopBar backHref="/magazine" title="TEST RESULT" />

      <ScreenBody className="px-4 pt-6 text-center">
        <Kicker>{result.quiz_title}</Kicker>

        <div className="relative mt-3 rounded-xl border border-neutral-400 px-4 py-6">
          <Reg corners="tl tr bl br" />
          <p className="cond text-[30px] leading-tight font-bold text-brand">
            {result.result_type}
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-700">
            {result.description}
          </p>
        </div>

        <div className="mt-5 text-left">
          <div className="mb-1.5 flex items-center justify-between text-[12px] font-semibold">
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
          <Kicker className="mb-2 text-[11px]">RECOMMENDED</Kicker>
          {result.recommendations.map((r, i) => (
            <p
              key={r}
              className={`flex items-center gap-2 border-t border-dashed border-neutral-400 py-2.5 ${
                i === result.recommendations.length - 1
                  ? "border-b border-dashed border-neutral-400"
                  : ""
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-brand text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <span className="text-[13.5px]">{r}</span>
            </p>
          ))}
        </div>
      </ScreenBody>

      <BottomBar bordered={false}>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="rounded-md border border-neutral-400 py-3 text-center text-[14px] font-bold"
          >
            결과 공유하기
          </button>
          <Link
            href="/write"
            className="bg-brand py-3 text-center text-[14px] font-bold text-white"
          >
            커뮤니티에서 검증받기
          </Link>
        </div>
      </BottomBar>
    </AppShell>
  );
}

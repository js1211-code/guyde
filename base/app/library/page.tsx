import Link from "next/link";
import { CategoryBadge, PhotoBox } from "@/components/badge";
import { Reg } from "@/components/reg";
import { AppShell, Kicker, PageTitle, ScreenBody } from "@/components/shell";
import { TabBar } from "@/components/tab-bar";
import { getHeroArticle, getLatestArticles, getQuizzes } from "@/lib/mock";

/**
 * ⑪ 도서관 홈 — 대표 글 1개 + 목록 + 테스트 카드.
 *
 * 매거진에서 이름이 바뀌었다. 매거진은 "이번 호"라 지나가면 끝인 인상인데,
 * 여기 글은 한 번 쓰면 계속 찾아보는 참고 자료에 가깝다.
 * 그래서 LATEST(최신)가 아니라 그냥 모아둔 서가로 보이게 한다.
 */
export default function LibraryPage() {
  const hero = getHeroArticle();

  return (
    <AppShell>
      <PageTitle>도서관</PageTitle>

      <ScreenBody>
        <Link href={`/library/${hero.id}`} className="block px-4">
          <PhotoBox className="h-[150px]" iconSize={24} />
          <span className="mt-2.5 inline-block">
            <CategoryBadge>{hero.category}</CategoryBadge>
          </span>
          <p className="mt-1.5 text-[17px] leading-snug font-bold">{hero.title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
            {hero.lead}
          </p>
        </Link>

        <Kicker className="px-4 pt-5 pb-2">ALL</Kicker>
        {getLatestArticles().map((a) => (
          <Link
            key={a.id}
            href={`/library/${a.id}`}
            className="flex items-center gap-3 border-t border-dashed border-neutral-400 px-4 py-2.5"
          >
            <PhotoBox
              className="h-[64px] w-[64px] shrink-0"
              iconSize={16}
              marks={false}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] leading-snug font-semibold">{a.title}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-600">
                <span>{a.category}</span>
                <span>· {a.read_minutes}분</span>
              </p>
            </div>
          </Link>
        ))}

        <Kicker className="px-4 pt-5 pb-2">TEST</Kicker>
        <div className="flex gap-3 overflow-x-auto px-4 pb-4">
          {getQuizzes().map((q) => (
            <Link
              key={q.id}
              href={`/library/quiz/${q.slug}`}
              className="relative min-w-[128px] flex-1 rounded-xl border border-neutral-400 p-3"
            >
              <Reg corners="tl br" size="sm" />
              <p className="text-[13.5px] leading-snug font-bold">{q.title}</p>
              <p className="cond mt-2 text-[11px] text-neutral-600">
                {q.taker_count.toLocaleString("ko-KR")}명 참여
              </p>
            </Link>
          ))}
        </div>
      </ScreenBody>

      <TabBar />
    </AppShell>
  );
}

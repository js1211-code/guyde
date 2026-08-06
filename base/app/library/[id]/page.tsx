import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryBadge, PhotoBox } from "@/components/badge";
import { ChevronLeftIcon } from "@/components/icons";
import { AppShell, Kicker, ScreenBody } from "@/components/shell";
import { ARTICLE_FIGURE, getArticle, getArticleIds } from "@/lib/mock";

export function generateStaticParams() {
  return getArticleIds().map((id) => ({ id }));
}

/** ⑫ 아티클 상세 — 끝에 커뮤니티로 넘기는 CTA가 붙는다 */
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = getArticle(id);
  if (!article) notFound();

  return (
    <AppShell>
      <div className="relative flex h-[240px] shrink-0 items-center justify-center border-b border-neutral-400 bg-brand-tint">
        {/* absolute inset-0 을 주면 안 된다. PhotoBox가 이미 relative라
            Tailwind에서 relative가 absolute보다 뒤에 정의돼 이겨버리고,
            높이가 0이 되어 사진이 통째로 사라진다. 부모 높이를 채우게 한다. */}
        <PhotoBox
          src={article.cover_url}
          alt=""
          className="h-full w-full border-0"
          iconSize={28}
        />
        {/* 사진 위에 뒤로가기 버튼이 얹히므로 위쪽만 어둡게 깔아 대비를 만든다.
            밝은 표지에서는 흰 아이콘이 그냥 사라진다. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink/45 to-transparent" />
        <Link
          href="/library"
          aria-label="뒤로"
          className="absolute top-4 left-4 z-10 text-white drop-shadow"
        >
          <ChevronLeftIcon size={20} />
        </Link>
      </div>

      <ScreenBody className="px-4 pt-4">
        <CategoryBadge>{article.category}</CategoryBadge>
        <h1 className="mt-2 text-[20.5px] leading-snug font-bold">{article.title}</h1>
        <p className="mt-2 flex items-center gap-2 text-[12.5px] text-neutral-600">
          <span>{article.published_at}</span>
          <span>·</span>
          <span>{article.read_minutes}분</span>
        </p>
        {/* Unsplash 라이선스상 표기 의무는 없지만, 남의 사진을 쓰면서
            누가 찍었는지 안 밝히는 건 예의가 아니다. */}
        <p className="mt-1 text-[12px] text-neutral-500">
          사진 {article.cover_by} · Unsplash
        </p>

        {article.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mt-4 mb-1.5 text-[15px] font-bold">{s.heading}</h2>
            <p className="text-[14.5px] leading-relaxed text-neutral-700">
              {s.body}
            </p>
            {/* 본문 삽화. 표지와 다른 사진을 쓴다 — 같은 사진이 한 화면에
                두 번 나오면 글이 짧아 보인다. */}
            {s.has_image && (
              <figure className="mt-3">
                <PhotoBox
                  src={ARTICLE_FIGURE.url}
                  alt=""
                  className="h-[150px]"
                  iconSize={20}
                />
                <figcaption className="mt-1 text-[11.5px] text-neutral-500">
                  Photo by {ARTICLE_FIGURE.by} · Unsplash
                </figcaption>
              </figure>
            )}
          </section>
        ))}

        {article.related.length > 0 && (
          <div className="mt-5 mb-4 rounded-xl border border-neutral-400 p-3.5">
            <Kicker className="mb-2 text-[12px]">RELATED IN COMMUNITY</Kicker>
            {article.related.map((title) => (
              <p
                key={title}
                className="border-t border-dashed border-neutral-400 py-2 text-[14.5px] leading-snug font-medium"
              >
                {title}
              </p>
            ))}
            <Link
              href="/write"
              className="mt-1.5 block bg-brand py-2.5 text-center text-[14px] font-bold text-white"
            >
              이 주제로 무난무난 판정받아보기
            </Link>
          </div>
        )}
      </ScreenBody>
    </AppShell>
  );
}

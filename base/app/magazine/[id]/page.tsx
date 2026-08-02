import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryBadge, PhotoBox } from "@/components/badge";
import { ChevronLeftIcon } from "@/components/icons";
import { AppShell, Kicker, ScreenBody } from "@/components/shell";
import { getArticle, getArticleIds } from "@/lib/mock";

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
        <PhotoBox className="absolute inset-0 border-0" iconSize={28} marks={false} />
        <Link
          href="/magazine"
          aria-label="뒤로"
          className="absolute top-4 left-4 z-10 text-white drop-shadow"
        >
          <ChevronLeftIcon size={20} />
        </Link>
      </div>

      <ScreenBody className="px-4 pt-4">
        <CategoryBadge>{article.category}</CategoryBadge>
        <h1 className="mt-2 text-[19px] leading-snug font-bold">{article.title}</h1>
        <p className="mt-2 flex items-center gap-2 text-[11.5px] text-neutral-600">
          <span>{article.published_at}</span>
          <span>·</span>
          <span>{article.read_minutes}분</span>
        </p>

        {article.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mt-4 mb-1.5 text-[14px] font-bold">{s.heading}</h2>
            <p className="text-[13.5px] leading-relaxed text-neutral-700">
              {s.body}
            </p>
            {s.has_image && (
              <PhotoBox className="mt-3 h-[130px]" iconSize={20} marks={false} />
            )}
          </section>
        ))}

        {article.related.length > 0 && (
          <div className="mt-5 mb-4 border border-neutral-400 p-3.5">
            <Kicker className="mb-2 text-[11px]">RELATED IN COMMUNITY</Kicker>
            {article.related.map((title) => (
              <p
                key={title}
                className="border-t border-dashed border-neutral-400 py-2 text-[13.5px] leading-snug font-medium"
              >
                {title}
              </p>
            ))}
            <Link
              href="/write"
              className="mt-1.5 block bg-brand py-2.5 text-center text-[13px] font-bold text-white"
            >
              이 주제로 무난무난 판정받아보기
            </Link>
          </div>
        )}
      </ScreenBody>
    </AppShell>
  );
}

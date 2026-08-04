"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryBadge, PhotoBox, PostTypeBadge } from "@/components/badge";
import { MessageIcon } from "@/components/icons";
import { NoticeBar } from "@/components/shell";
import { Temperature } from "@/components/temperature";
import { fetchFeed, type FeedItem } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { CATEGORIES, type Category, type PostType } from "@/lib/constants";

/**
 * 탭 — '무난무난'과 '정보공유'는 카테고리가 아니라 글 유형 필터다(F-10·F-12).
 * 나머지는 전부 카테고리. 두 축이 한 줄에 섞여 있으니 아래 분기에서 헷갈리지 말 것.
 */
const TYPE_TABS = {
  무난무난: "무난함판정",
  정보공유: "정보공유",
} as const satisfies Record<string, PostType>;

const TABS = ["전체", ...Object.keys(TYPE_TABS), ...CATEGORIES] as const;
type Tab = (typeof TABS)[number];

const isTypeTab = (t: Tab): t is keyof typeof TYPE_TABS => t in TYPE_TABS;

type Sort = "최신순" | "인기순";

export function Feed() {
  const [tab, setTab] = useState<Tab>("전체");
  const [sort, setSort] = useState<Sort>("최신순");
  // 어느 탭의 결과인지 같이 들고 있는다. 탭이 바뀌면 그 자체가 로딩 신호라
  // 이펙트 안에서 상태를 한 번 더 비울 필요가 없다.
  const [loaded, setLoaded] = useState<{ tab: Tab; rows: FeedItem[] } | null>(null);

  useEffect(() => {
    let alive = true;
    fetchFeed(
      tab === "전체"
        ? {}
        : isTypeTab(tab)
          ? { post_type: TYPE_TABS[tab] }
          : { category: tab as Category },
    )
      .then((rows) => alive && setLoaded({ tab, rows }))
      .catch(() => alive && setLoaded({ tab, rows: [] }));
    return () => {
      alive = false;
    };
  }, [tab]);

  const items = loaded?.tab === tab ? loaded.rows : null;

  // 서버는 최신순으로만 준다(F-13). 인기순은 반응+댓글로 클라이언트에서 정렬.
  const visible =
    items && sort === "인기순"
      ? [...items].sort(
          (a, b) =>
            b.reaction_count + b.comment_count - (a.reaction_count + a.comment_count),
        )
      : items;

  return (
    <>
      <div className="scroll-area flex gap-4 overflow-x-auto border-b border-neutral-400 px-4">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-current={tab === t ? "page" : undefined}
            className={`-mb-px shrink-0 pt-1 pb-2 text-[14px] whitespace-nowrap ${
              tab === t
                ? "border-b-2 border-brand font-bold text-ink"
                : "text-neutral-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isTypeTab(tab) ? (
        <NoticeBar>
          {tab === "무난무난"
            ? "대중이 무난하다고 판정한 글만 모았어요"
            : "묻는 글이 아니라 알려주는 글만 모았어요"}
        </NoticeBar>
      ) : (
        <div className="flex items-center gap-3 px-4 py-2">
          {(["최신순", "인기순"] as Sort[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`text-[12.5px] ${
                sort === s ? "font-bold text-brand" : "text-neutral-500"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div>
        {visible === null && (
          <p className="px-4 py-10 text-center text-[13px] text-neutral-500">
            불러오는 중…
          </p>
        )}
        {visible?.length === 0 && (
          <p className="px-4 py-10 text-center text-[13px] leading-relaxed text-neutral-600">
            아직 글이 없어요.
            <br />
            오른쪽 아래 + 버튼으로 첫 글을 남겨보세요.
          </p>
        )}
        {visible?.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const hasPhoto = Boolean(item.thumbnail_url);
  // 썸네일이 없을 때만 본문 2줄 미리보기를 보여준다 (F-15)
  const showPreview = !hasPhoto && item.body.trim().length > 0;

  const meta = (
    <div className="mt-2 flex items-center gap-3 text-[11.5px] text-neutral-600">
      {item.post_type === "선택지투표" && (
        <span className="cond tracking-wide">VOTES {item.reaction_count}</span>
      )}
      {item.post_type === "정보공유" && item.reaction_count > 0 && (
        <span className="cond tracking-wide">LIKES {item.reaction_count}</span>
      )}
      {item.comment_count > 0 && (
        <span className="flex items-center gap-1">
          <MessageIcon size={12} />
          {item.comment_count}
        </span>
      )}
    </div>
  );

  const author = (
    <div className="mt-2 flex items-center gap-1.5">
      <span className="text-[12px] font-semibold">{item.nickname}</span>
      <Temperature value={item.temperature} />
    </div>
  );

  return (
    <Link
      href={`/post/${item.id}`}
      className="block border-b border-dashed border-neutral-400 px-4 py-3"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <CategoryBadge>{item.category}</CategoryBadge>
        <PostTypeBadge
          postType={item.post_type}
          nanhanPercent={item.nanhan_percent}
        />
        <span className="ml-auto text-[11px] text-neutral-600">
          {timeAgo(item.created_at)}
        </span>
      </div>

      {hasPhoto ? (
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] leading-snug font-medium">{item.title}</p>
            {meta}
            {author}
          </div>
          <PhotoBox
            src={item.thumbnail_url}
            alt=""
            className="h-[68px] w-[68px] shrink-0"
            marks
          />
        </div>
      ) : (
        <>
          <p className="text-[15px] leading-snug font-medium">{item.title}</p>
          {showPreview && (
            <p className="line-clamp-2 mt-1 text-[13px] leading-relaxed text-neutral-600">
              {item.body}
            </p>
          )}
          {meta}
          {author}
        </>
      )}
    </Link>
  );
}

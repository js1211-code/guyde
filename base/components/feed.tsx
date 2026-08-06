"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryBadge, PhotoBox, PostTypeBadge } from "@/components/badge";
import { HeartIcon, MessageIcon, VoteIcon } from "@/components/icons";
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
            {/* scroll-area(overflow-y:auto)를 쓰면 가로 탭 줄에 세로 스크롤까지 붙어
          손가락이 위아래로 밀린다. 가로만 흐르게 하고 세로는 잠근다. */}
      <div className="rail flex gap-4 border-b border-neutral-400 px-4">
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

      {/*
        탭마다 안내 띠를 두지 않는다. 탭 이름이 이미 그 뜻이라 한 줄 더 붙이면
        같은 말을 두 번 하는 셈이고, 탭을 옮길 때마다 목록 시작 위치가 들쭉날쭉해진다.
        (무난무난은 설명 자체가 틀리기도 했다 — 이 탭은 판정글을 전부 보여준다.
         60% 이상만 모은 곳은 도서관의 무난템 서가다.)
      */}
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

/**
 * 피드 카드. 검색 결과도 이걸 쓴다 — 같은 글이 화면마다 다르게 생기면
 * 검색이 별개의 목록처럼 읽힌다.
 */
export function FeedCard({ item }: { item: FeedItem }) {
  const hasPhoto = Boolean(item.thumbnail_url);
  // 썸네일이 없을 때만 본문 2줄 미리보기를 보여준다 (F-15)
  const showPreview = !hasPhoto && item.body.trim().length > 0;

  const meta = (
    <div className="mt-2 flex items-center gap-3 text-[11.5px] text-neutral-600">
      {/* 영문 라벨 대신 모양으로 보여준다. 하트=좋아요, 투표함=투표.
          숫자 옆에 뭐가 붙었는지 읽지 않고도 구분돼야 한다. */}
      {item.post_type === "선택지투표" && (
        <span className="flex items-center gap-1">
          <VoteIcon size={12} />
          {item.reaction_count}
        </span>
      )}
      {item.post_type === "정보공유" && item.reaction_count > 0 && (
        <span className="flex items-center gap-1">
          <HeartIcon size={12} />
          {item.reaction_count}
        </span>
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

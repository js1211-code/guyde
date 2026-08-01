"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/badge";
import { MessageIcon } from "@/components/icons";
import { PhotoBox } from "@/components/photo";
import { FeedVoteBar } from "@/components/vote-bar";
import { categories, splitBody, type Category, type FeedItem } from "@/lib/mock";

/**
 * 카테고리 탭 + 피드 목록.
 * 목데이터라 필터링을 클라이언트에서 하지만, Supabase로 가면
 * 탭 클릭 → posts_feed 뷰 재조회로 바꾸면 된다.
 */
export function FeedList({
  items,
  totalCount,
}: {
  items: FeedItem[];
  totalCount: number;
}) {
  const [active, setActive] = useState<Category | null>(null);
  const visible = active ? items.filter((i) => i.category === active) : items;

  return (
    <>
      <div className="flex border-b border-neutral-400 px-4">
        <Tab active={active === null} onClick={() => setActive(null)}>
          전체{" "}
          <span className="cond font-semibold text-accent-700">{totalCount}</span>
        </Tab>
        {categories.slice(0, 3).map((c) => (
          <Tab key={c} active={active === c} onClick={() => setActive(c)}>
            {c}
          </Tab>
        ))}
      </div>

      <div>
        {visible.map((item) => (
          <FeedRow key={item.id} item={item} />
        ))}
        {visible.length === 0 && (
          <p className="px-4 py-10 text-center text-[13px] text-neutral-600">
            아직 이 카테고리엔 질문이 없어요
          </p>
        )}
      </div>
    </>
  );
}

function Tab({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`-mb-px px-3 pt-1 pb-2 text-[14px] ${
        active
          ? "border-b-2 border-ink font-bold text-ink"
          : "text-neutral-600"
      }`}
    >
      {children}
    </button>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  const { title } = splitBody(item.body);

  return (
    <Link
      href={`/post/${item.id}`}
      className="block border-b border-dashed border-neutral-400 px-4 py-3"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="cond text-[12px] font-semibold tracking-[0.08em] text-neutral-600">
          Q-{item.id}
        </span>
        <Badge>익명</Badge>
        {item.post_type === "dday" && item.event_label && (
          <Badge variant="accent">{item.event_label}</Badge>
        )}
        <span className="ml-auto text-[11px] text-neutral-600">
          {item.created_at}
        </span>
      </div>

      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-snug font-medium">{title}</p>

          {item.leading_percent !== null && (
            <FeedVoteBar leadingPercent={item.leading_percent} />
          )}

          <div className="mt-2 flex items-center gap-3 text-[11.5px] text-neutral-600">
            <span className="flex items-center gap-1">
              <MessageIcon size={12} />
              {item.comment_count}
            </span>
            <span className="cond tracking-wide">VOTES {item.vote_count}</span>
          </div>
        </div>

        {item.has_image && (
          <PhotoBox className="h-[68px] w-[68px] shrink-0" />
        )}
      </div>
    </Link>
  );
}

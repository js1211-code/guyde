"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryBadge, PostTypeBadge } from "@/components/badge";
import { ThumbsUpIcon, VoteIcon } from "@/components/icons";
import { AppShell, ScreenBody, TopBar } from "@/components/shell";
import { timeAgo } from "@/lib/format";
import {
  fetchMyComments,
  fetchMyPosts,
  type FeedItem,
  type MyComment,
} from "@/lib/api";

type Tab = "posts" | "comments";

/**
 * ⑲ 내 활동 — 내 글 / 내 댓글.
 * 둘 다 device_id 기준 전용 엔드포인트를 쓴다(F-74·F-75).
 * 피드를 받아 걸러내면 첫 페이지 밖의 내 글이 빠져서 안 된다.
 */
export default function ActivityPage() {
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<FeedItem[] | null>(null);
  const [comments, setComments] = useState<MyComment[] | null>(null);

  useEffect(() => {
    fetchMyPosts()
      .then(setPosts)
      .catch(() => setPosts([]));
    fetchMyComments()
      .then(setComments)
      .catch(() => setComments([]));
  }, []);

  return (
    <AppShell>
      <TopBar backHref="/me" title="내 활동" />

      <div className="flex border-b border-neutral-400 px-4 pt-3">
        {(
          [
            ["posts", "내 글", posts?.length],
            ["comments", "내 댓글", comments?.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px pr-6 pb-2.5 text-[15px] ${
              tab === key
                ? "border-b-2 border-brand font-bold text-ink"
                : "text-neutral-500"
            }`}
          >
            {label}
            {count !== undefined && (
              <span className="cond ml-1 font-semibold">{count}</span>
            )}
          </button>
        ))}
      </div>

      <ScreenBody className="px-4">
        {tab === "posts" ? (
          <PostList items={posts} />
        ) : (
          <CommentList items={comments} />
        )}
      </ScreenBody>
    </AppShell>
  );
}

function PostList({ items }: { items: FeedItem[] | null }) {
  if (items === null) return <Loading />;
  if (items.length === 0) return <Empty>아직 쓴 글이 없어요</Empty>;

  return (
    <>
      {items.map((p) => (
        <Link
          key={p.id}
          href={`/post/${p.id}`}
          className="block border-b border-dashed border-neutral-400 py-3"
        >
          <div className="mb-1 flex items-center gap-1.5">
            <CategoryBadge>{p.category}</CategoryBadge>
            <PostTypeBadge postType={p.post_type} nanhanPercent={p.nanhan_percent} />
            <span className="ml-auto text-[12px] text-neutral-600">
              {timeAgo(p.created_at)}
            </span>
          </div>
          <p className="text-[15.5px] leading-snug font-medium">{p.title}</p>
          <div className="mt-1.5 flex items-center gap-3 text-[12.5px] text-neutral-600">
            {p.post_type === "선택지투표" && (
              <span className="flex items-center gap-1">
                <VoteIcon size={12} />
                {p.reaction_count}
              </span>
            )}
            <span>댓글 {p.comment_count}</span>
          </div>
        </Link>
      ))}
    </>
  );
}

function CommentList({ items }: { items: MyComment[] | null }) {
  if (items === null) return <Loading />;
  if (items.length === 0) return <Empty>아직 쓴 댓글이 없어요</Empty>;

  return (
    <>
      {items.map((c) => (
        <Link
          key={c.id}
          href={c.post ? `/post/${c.post.id}` : "#"}
          className="block border-b border-dashed border-neutral-400 py-3"
        >
          {/* 어느 글에 단 댓글인지 먼저 보여야 맥락이 산다 */}
          <p className="mb-1 text-[12.5px] text-neutral-600">
            {c.post?.title ?? "삭제된 글"}
          </p>
          <p className="text-[15px] leading-relaxed">{c.body}</p>
          <span className="mt-1.5 flex items-center gap-1 text-[12.5px] text-neutral-500">
            <ThumbsUpIcon size={13} />
            <span className="font-bold">{c.likes}</span>
          </span>
        </Link>
      ))}
    </>
  );
}

function Loading() {
  return (
    <p className="py-10 text-center text-[14px] text-neutral-500">불러오는 중…</p>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-10 text-center text-[14px] text-neutral-600">{children}</p>
  );
}

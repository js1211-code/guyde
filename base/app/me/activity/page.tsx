"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryBadge, PostTypeBadge } from "@/components/badge";
import { AppShell, ScreenBody, TopBar } from "@/components/shell";
import { fetchFeed, type FeedItem } from "@/lib/api";

/**
 * ⑲ 내 활동 — 내 글 / 내 댓글 두 섹션.
 * 전부 device_id 기준이다(F-74·F-75). 지금은 피드에서 is_mine으로 걸러 쓰고,
 * 내 댓글 전용 엔드포인트가 생기면 아래 두 번째 탭만 바꾸면 된다.
 */
export default function ActivityPage() {
  const [tab, setTab] = useState<"posts" | "comments">("posts");
  const [mine, setMine] = useState<FeedItem[] | null>(null);

  useEffect(() => {
    fetchFeed({})
      .then((rows) => setMine(rows.filter((r) => r.is_mine)))
      .catch(() => setMine([]));
  }, []);

  return (
    <AppShell>
      <TopBar backHref="/me" title="내 활동" />

      <div className="flex border-b border-neutral-400 px-4 pt-3">
        {(
          [
            ["posts", "내 글"],
            ["comments", "내 댓글"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px pr-6 pb-2.5 text-[14px] ${
              tab === key
                ? "border-b-2 border-brand font-bold text-ink"
                : "text-neutral-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ScreenBody className="px-4">
        {tab === "posts" ? (
          <>
            {mine === null && (
              <p className="py-10 text-center text-[13px] text-neutral-500">
                불러오는 중…
              </p>
            )}
            {mine?.length === 0 && (
              <p className="py-10 text-center text-[13px] text-neutral-600">
                아직 쓴 글이 없어요
              </p>
            )}
            {mine?.map((p) => (
              <Link
                key={p.id}
                href={`/post/${p.id}`}
                className="block border-b border-dashed border-neutral-400 py-3"
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <CategoryBadge>{p.category}</CategoryBadge>
                  <PostTypeBadge
                    postType={p.post_type}
                    nanhanPercent={p.nanhan_percent}
                  />
                  <span className="ml-auto text-[11px] text-neutral-600">
                    {p.created_at}
                  </span>
                </div>
                <p className="text-[14.5px] leading-snug font-medium">{p.title}</p>
                <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-neutral-600">
                  {p.post_type === "선택지투표" && (
                    <span className="cond tracking-wide">
                      VOTES {p.reaction_count}
                    </span>
                  )}
                  <span>댓글 {p.comment_count}</span>
                </div>
              </Link>
            ))}
          </>
        ) : (
          <p className="py-10 text-center text-[13px] leading-relaxed text-neutral-600">
            내 댓글 목록은 아직 준비 중이에요.
            <br />
            <span className="text-[12px] text-neutral-500">
              (댓글 전용 조회 API가 붙으면 여기에 표시됩니다)
            </span>
          </p>
        )}
      </ScreenBody>
    </AppShell>
  );
}

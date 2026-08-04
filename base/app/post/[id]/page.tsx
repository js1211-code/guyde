"use client";

import { use, useEffect, useState } from "react";
import { CategoryBadge, MineBadge, PhotoBox, PostTypeBadge } from "@/components/badge";
import { CheckIcon, HeartIcon, MoreIcon, ThumbsUpIcon } from "@/components/icons";
import { AppShell, Kicker, ScreenBody, TopBar } from "@/components/shell";
import { Temperature } from "@/components/temperature";
import { timeAgo } from "@/lib/format";
import {
  addComment,
  castNanhanVote,
  castPollVote,
  fetchPost,
  togglePostLike,
  toggleCommentLike,
  type PostDetail,
} from "@/lib/api";

/**
 * 글 상세 — 유형에 따라 붙는 위젯이 다르다.
 *   선택지투표 → 투표 전(⑦) / 후(⑧)
 *   무난함판정 → 판정 버튼 2종(⑨)
 *   일반질문   → 댓글만(⑩)
 */
export default function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<PostDetail | null>(null);
  const [missing, setMissing] = useState(false);

  const reload = () =>
    fetchPost(id)
      .then(setData)
      .catch(() => setMissing(true));

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (missing) {
    return (
      <AppShell>
        <TopBar backHref="/" title="GUYDE" />
        <p className="px-4 py-16 text-center text-[13px] text-neutral-600">
          없는 글이에요
        </p>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <TopBar backHref="/" title="GUYDE" />
        <p className="px-4 py-16 text-center text-[13px] text-neutral-500">
          불러오는 중…
        </p>
      </AppShell>
    );
  }

  const { post } = data;

  return (
    <AppShell>
      <TopBar
        backHref="/"
        title={`Q-${post.id.slice(0, 4).toUpperCase()}`}
        right={<MoreIcon size={20} />}
      />

      <ScreenBody>
        <article className="border-b-8 border-neutral-200 px-4 pt-3.5 pb-4">
          <div className="mb-2 flex items-center gap-1.5">
            <CategoryBadge>{post.category}</CategoryBadge>
            {post.post_type === "무난함판정" ? (
              <span className="border border-brand-tint-b bg-brand-tint px-1.5 py-px text-[10.5px] font-bold text-brand-dark">
                무난함 판정
              </span>
            ) : (
              <PostTypeBadge postType={post.post_type} />
            )}
            <span className="ml-auto text-[11px] text-neutral-600">
              {timeAgo(post.created_at)}
            </span>
          </div>

          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-[12.5px] font-semibold">{post.nickname}</span>
            <Temperature value={post.temperature} size={11.5} />
            {post.is_mine && <MineBadge />}
          </div>

          <h1 className="text-[17px] leading-snug font-semibold">{post.title}</h1>
          {post.body && (
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-600">
              {post.body}
            </p>
          )}

          {post.images.map((img) => (
            <PhotoBox
              key={img.id}
              src={img.url}
              alt=""
              className="mt-3 h-[160px]"
              iconSize={24}
            />
          ))}

          {data.poll && <Poll postId={post.id} poll={data.poll} onDone={reload} />}
          {data.nanhan && (
            <Nanhan postId={post.id} nanhan={data.nanhan} onDone={reload} />
          )}
          {data.likes && (
            <Likes
              postId={post.id}
              likes={data.likes}
              isMine={post.is_mine}
              onDone={reload}
            />
          )}
        </article>

        <Comments postId={post.id} data={data} onDone={reload} />
      </ScreenBody>
    </AppShell>
  );
}

/**
 * 정보 공유 글의 좋아요 (F-80).
 *
 * 투표·판정과 달리 결과를 감추지 않는다. 물어보는 글이 아니라 알려주는 글이라
 * "몇 명이 도움받았나"가 본문의 일부처럼 읽혀야 한다.
 *
 * 자기 글에는 누를 수 없다. DB 트리거가 막지만, 눌리는 것처럼 보였다가
 * 실패하면 고장으로 보이므로 버튼부터 잠근다.
 */
function Likes({
  postId,
  likes,
  isMine,
  onDone,
}: {
  postId: string;
  likes: NonNullable<PostDetail["likes"]>;
  isMine: boolean;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await togglePostLike(postId, likes.liked_by_me).catch(() => {});
    await onDone();
    setBusy(false);
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={busy || isMine}
        aria-pressed={likes.liked_by_me}
        className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-[14px] font-bold transition-colors ${
          likes.liked_by_me
            ? "border-brand bg-brand/15 text-brand-dark"
            : "border-neutral-400 text-neutral-700"
        } ${isMine ? "opacity-45" : ""}`}
      >
        <HeartIcon
          size={16}
          className={likes.liked_by_me ? "text-brand" : "text-neutral-500"}
        />
        도움돼요
        {likes.count > 0 && (
          <span className="cond text-[15px]">{likes.count}</span>
        )}
      </button>
      <p className="text-[11.5px] text-neutral-500">
        {isMine
          ? "내 글에는 누를 수 없어요"
          : "받은 좋아요는 글쓴이 온도에 쌓여요"}
      </p>
    </div>
  );
}

/** ⑦⑧ 선택지 투표 — 투표해야 결과가 열린다 */
function Poll({
  postId,
  poll,
  onDone,
}: {
  postId: string;
  poll: NonNullable<PostDetail["poll"]>;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function vote(optionId: string) {
    setBusy(true);
    await castPollVote(postId, optionId).catch(() => {});
    await onDone();
    setBusy(false);
  }

  if (!poll.revealed) {
    return (
      <>
        <div className="mt-3 flex flex-col gap-2">
          {poll.options.map((o) => (
            <button
              key={o.id}
              type="button"
              disabled={busy}
              onClick={() => vote(o.id)}
              className="border border-neutral-500 px-3.5 py-3 text-left text-[14.5px] font-semibold"
            >
              {o.text}
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-center text-[12px] text-neutral-600">
          투표하면 결과를 볼 수 있어요
        </p>
      </>
    );
  }

  const top = Math.max(...poll.options.map((o) => o.vote_count ?? 0));

  return (
    <>
      <div className="mt-3 flex flex-col gap-2">
        {poll.options.map((o) => {
          const mine = o.id === poll.my_option_id;
          const leading = (o.vote_count ?? 0) === top;
          const pct = o.percent ?? 0;

          return (
            <button
              key={o.id}
              type="button"
              disabled={busy}
              onClick={() => !mine && vote(o.id)}
              className={`relative flex h-[38px] items-center overflow-hidden border text-left ${
                mine
                  ? "border-2 border-brand"
                  : leading
                    ? "border-brand"
                    : "border-neutral-400"
              }`}
            >
              {/*
                채움은 배경 띠로만 둔다. 라벨을 이 안에 넣으면 0%·100%에서
                글자가 막대 밖으로 새거나 눌려 버린다.
              */}
              <span
                aria-hidden
                className={`absolute inset-y-0 left-0 ${
                  leading ? "bg-brand/15" : "hatch"
                }`}
                style={{ width: `${pct}%` }}
              />
              <span className="relative flex w-full items-center justify-between px-3 text-[13px]">
                <span className={leading ? "font-bold" : "text-neutral-700"}>
                  {o.text}
                </span>
                <span
                  className={`flex items-center gap-1 ${
                    leading ? "font-bold text-brand" : "text-neutral-600"
                  }`}
                >
                  {mine && <CheckIcon size={14} className="text-brand" />}
                  {pct}%
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 text-center text-[12px] text-neutral-600">
        총 {poll.total_votes}표 · 다른 선택지를 누르면 표가 옮겨가요
      </p>
    </>
  );
}

/** ⑨ 무난함 판정 — 고정 2종. 작성자가 선택지를 만들 수 없다. */
function Nanhan({
  postId,
  nanhan,
  onDone,
}: {
  postId: string;
  nanhan: NonNullable<PostDetail["nanhan"]>;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function vote(choice: "무난해요" | "애매해요") {
    setBusy(true);
    await castNanhanVote(postId, choice).catch(() => {});
    await onDone();
    setBusy(false);
  }

  return (
    <>
      <p className="mt-4 text-center">
        <span className="cond text-[42px] leading-none font-bold text-brand">
          {nanhan.percent === null ? "아직 판정 전" : `무난함 ${nanhan.percent}%`}
        </span>
      </p>
      <div className="mt-3 flex gap-2">
        {(["무난해요", "애매해요"] as const).map((choice) => {
          const picked = nanhan.my_choice === choice;
          return (
            <button
              key={choice}
              type="button"
              disabled={busy}
              onClick={() => vote(choice)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-3 ${
                picked
                  ? "border-2 border-brand bg-brand-tint"
                  : "border border-neutral-400"
              }`}
            >
              {picked && (
                <CheckIcon
                  size={16}
                  className="absolute top-1.5 right-1.5 text-brand"
                />
              )}
              <span
                className={`text-[14px] font-bold ${
                  picked ? "text-brand-dark" : "text-neutral-600"
                }`}
              >
                {choice}
              </span>
              <span
                className={`cond text-[13px] font-semibold ${
                  picked ? "text-brand-dark" : "text-neutral-600"
                }`}
              >
                {nanhan[choice]}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/** 댓글 — 추천순 → 최신순 (F-43). 자기 댓글은 추천할 수 없다(F-42). */
function Comments({
  postId,
  data,
  onDone,
}: {
  postId: string;
  data: PostDetail;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!draft.trim()) return;
    setBusy(true);
    await addComment(postId, draft.trim()).catch(() => {});
    setDraft("");
    await onDone();
    setBusy(false);
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <Kicker className="text-[12.5px]">COMMENTS {data.comments.length}</Kicker>
        {data.comments.length > 0 && (
          <span className="text-[12px] font-bold text-brand">추천순</span>
        )}
      </div>

      {data.comments.map((c) => (
        <div
          key={c.id}
          className="border-t border-dashed border-neutral-400 px-4 py-3"
        >
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-[12.5px] font-semibold">{c.nickname}</span>
            <Temperature value={c.temperature} />
            {c.is_mine && <MineBadge />}
          </div>
          <p className="text-[14px] leading-relaxed">{c.body}</p>
          <button
            type="button"
            disabled={c.is_mine || busy}
            onClick={async () => {
              setBusy(true);
              await toggleCommentLike(c.id, c.liked_by_me).catch(() => {});
              await onDone();
              setBusy(false);
            }}
            className={`mt-1.5 flex items-center gap-1 text-[11.5px] ${
              c.is_mine
                ? "text-neutral-400"
                : c.liked_by_me
                  ? "text-brand"
                  : "text-neutral-500"
            }`}
          >
            <ThumbsUpIcon size={13} />
            <span className="font-bold">{c.likes}</span>
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2 border-t border-neutral-400 px-4 py-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="댓글을 남겨보세요"
          className="flex-1 rounded-md border border-neutral-400 px-3 py-2 text-[13.5px]"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || !draft.trim()}
          className="cond text-[13px] font-bold text-brand disabled:text-neutral-400"
        >
          등록
        </button>
      </div>
    </>
  );
}

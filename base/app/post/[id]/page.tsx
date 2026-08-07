"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ZoomablePhoto } from "@/components/lightbox";
import { use, useEffect, useRef, useState } from "react";
import {
  CategoryBadge,
  ExpertBadge,
  MineBadge,
  PhotoBox,
  PostTypeBadge,
} from "@/components/badge";
import {
  CheckIcon,
  GavelDownIcon,
  GavelUpIcon,
  HeartIcon,
  ImageIcon,
  MoreIcon,
  PencilIcon,
  SirenIcon,
  TrashIcon,
} from "@/components/icons";
import { AppShell, Kicker, ScreenBody, TopBar } from "@/components/shell";
import { Temperature } from "@/components/temperature";
import { timeAgo, timeLeft } from "@/lib/format";
import {
  addComment,
  uploadImage,
  castNanhanVote,
  clearNanhanVote,
  castPollVote,
  clearPollVote,
  closePost,
  fetchPost,
  deletePost,
  reportPost,
  togglePostLike,
  toggleCommentLike,
  type Comment,
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
        <p className="px-4 py-16 text-center text-[14px] text-neutral-600">
          없는 글이에요
        </p>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <TopBar backHref="/" title="GUYDE" />
        <p className="px-4 py-16 text-center text-[14px] text-neutral-500">
          불러오는 중…
        </p>
      </AppShell>
    );
  }

  const { post } = data;
  // 손으로 닫았든 72시간이 지났든 뷰가 계산한 값 하나만 본다.
  const closed = post.is_closed;
  const votable =
    post.post_type === "선택지투표" || post.post_type === "무난함판정";

  return (
    <AppShell>
      <TopBar
        backHref="/"
        title="GUYDE"
        right={
          <PostMenu
            postId={post.id}
            isMine={post.is_mine}
            // 표를 받는 글만 종료할 수 있다. 이미 닫혔으면 항목을 감춘다.
            canClose={post.is_mine && !closed && votable}
            onDone={reload}
          />
        }
      />

      <ScreenBody>
        <article className="border-b-8 border-neutral-200 px-4 pt-3.5 pb-4">
          <div className="mb-2 flex items-center gap-1.5">
            <CategoryBadge>{post.category}</CategoryBadge>
            {post.post_type === "무난함판정" ? (
              <span className="border border-brand-tint-b bg-brand-tint px-1.5 py-px text-[11.5px] font-bold text-brand-dark">
                무난함 판정
              </span>
            ) : (
              <PostTypeBadge postType={post.post_type} />
            )}
            {votable &&
              (closed ? (
                <span className="rounded-xs bg-neutral-300 px-1.5 py-px text-[11.5px] font-bold text-neutral-700">
                  종료
                </span>
              ) : (
                // 언제까지 열려 있는지 알아야 "지금 눌러야 하나"가 정해진다.
                <span className="rounded-xs bg-brand-tint px-1.5 py-px text-[11.5px] font-bold text-brand-dark">
                  {timeLeft(post.closes_at) ?? "곧 종료"}
                </span>
              ))}
            <span className="ml-auto text-[12px] text-neutral-600">
              {timeAgo(post.created_at)}
            </span>
          </div>

          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-[13.5px] font-semibold">{post.nickname}</span>
            <Temperature value={post.temperature} size={11.5} />
            {post.is_mine && <MineBadge />}
          </div>

          <h1 className="text-[18.5px] leading-snug font-semibold">{post.title}</h1>
          {post.body && (
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-neutral-600">
              {post.body}
            </p>
          )}

          {/*
            비율을 정하지 않는다. 3:4로 올리면 3:4, 1:1이면 1:1로 그대로 뜬다.
            어떤 비율로 고정하든 누군가의 사진은 잘리는데, 이 앱의 사진은
            착장·머리처럼 잘리면 판단이 안 되는 것들이다.
          */}
          {post.images.map((img) => (
            <ZoomablePhoto
              key={img.id}
              src={img.url}
              alt=""
              className="mt-3"
              iconSize={24}
              natural
            />
          ))}

          {data.poll && (
            <Poll
              postId={post.id}
              poll={data.poll}
              closed={closed}
              onDone={reload}
            />
          )}
          {data.nanhan && (
            <Nanhan
              postId={post.id}
              nanhan={data.nanhan}
              closed={closed}
              onDone={reload}
            />
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

  // 내 글에는 버튼을 그리지 않는다. 대신 몇 명이 도움받았는지만 보여준다.
  if (isMine) {
    return (
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <span className="flex items-center gap-2 text-[15px] font-bold text-neutral-600">
          <HeartIcon size={16} className="text-neutral-500" />
          {likes.count > 0 ? `${likes.count}명이 도움받았어요` : "아직 반응이 없어요"}
        </span>
        <p className="text-[12.5px] text-neutral-500">
          받은 좋아요는 내 온도에 쌓여요
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={likes.liked_by_me}
        className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-[15px] font-bold transition-colors ${
          likes.liked_by_me
            ? "border-brand bg-brand/15 text-brand-dark"
            : "border-neutral-400 text-neutral-700"
        }`}
      >
        <HeartIcon
          size={16}
          className={likes.liked_by_me ? "text-brand" : "text-neutral-500"}
        />
        도움돼요
        {likes.count > 0 && (
          <span className="cond text-[16px]">{likes.count}</span>
        )}
      </button>
      <p className="text-[12.5px] text-neutral-500">
        받은 좋아요는 글쓴이 온도에 쌓여요
      </p>
    </div>
  );
}

/** ⑦⑧ 선택지 투표 — 투표해야 결과가 열린다 */
function Poll({
  postId,
  poll,
  closed,
  onDone,
}: {
  postId: string;
  poll: NonNullable<PostDetail["poll"]>;
  closed: boolean;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  /**
   * 이미 고른 걸 다시 누르면 취소, 아니면 그 선택지로 표를 옮긴다.
   * 취소하면 결과도 다시 감춰진다 — 투표해야 결과가 열리는 규칙(F-32)이
   * 취소한 뒤에도 그대로 지켜져야 한다.
   */
  async function vote(optionId: string) {
    setBusy(true);
    const 취소 = optionId === poll.my_option_id;
    await (취소 ? clearPollVote(postId) : castPollVote(postId, optionId)).catch(
      () => {},
    );
    await onDone();
    setBusy(false);
  }

  // 사진이 하나라도 붙어 있으면 줄 높이를 키운다. 사진 있는 줄만 키우면
  // 선택지끼리 높이가 들쭉날쭉해서 어느 쪽이 더 중요해 보인다.
  const withPhotos = poll.options.some((o) => o.image_url);

  if (!poll.revealed) {
    return (
      <>
        <div className="mt-3 flex flex-col gap-2">
          {poll.options.map((o) => (
            /*
              줄 전체가 버튼이 아니라 **사진 + 투표 버튼** 두 조각이다.

              사진을 누르면 원본이 크게 뜬다(ZoomablePhoto). 52px짜리 썸네일만
              보고 고르라고 하면 옷의 핏도 가방의 크기도 안 보인다 — 정작
              결정하는 자리에서 사진이 제일 작았다.

              ⚠️ 그래서 바깥을 <button>으로 둘 수 없다. ZoomablePhoto가 자기
                 버튼을 갖고 있어서 버튼 안에 버튼이 되면 안 된다.
                 투표 버튼은 flex-1이라 사진 오른쪽 전부를 먹는다 — 누를 자리는
                 줄어들지 않는다.
            */
            <div
              key={o.id}
              className="flex items-center gap-2.5 rounded-lg border border-neutral-500 px-3.5 py-3"
            >
              {withPhotos && (
                <ZoomablePhoto
                  src={o.image_url}
                  alt=""
                  className="h-[52px] w-[52px] shrink-0"
                  iconSize={16}
                />
              )}
              <button
                type="button"
                disabled={busy || closed}
                onClick={() => vote(o.id)}
                className="flex-1 self-stretch text-left text-[15.5px] font-semibold"
              >
                {o.text}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-center text-[13px] text-neutral-600">
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
            /*
              결과 줄은 막대 전체가 투표(취소) 버튼이라, 투표 전 줄처럼 조각을
              나눌 수가 없다 — 나누면 % 쪽이 안 눌린다.

              그래서 사진을 버튼 **위에 덮는다**. 버튼 안에는 같은 크기의 빈
              자리만 두어 배치를 그대로 유지하고, 사진은 형제로 절대 배치한다.
              버튼 안에 버튼을 넣지 않으면서 줄 전체가 계속 눌린다.
            */
            <div key={o.id} className="relative">
            <button
              type="button"
              disabled={busy || closed}
              // mine이어도 막지 않는다 — 그게 취소하는 유일한 방법이다.
              onClick={() => vote(o.id)}
              className={`relative flex w-full items-center overflow-hidden rounded-lg border text-left ${
                withPhotos ? "h-[60px]" : "h-[38px]"
              } ${
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
              <span className="relative flex w-full items-center justify-between gap-2 px-3 text-[14px]">
                <span className="flex min-w-0 items-center gap-2.5">
                  {/* 사진이 놓일 빈 자리. 실제 사진은 아래에서 이 위에 덮는다. */}
                  {withPhotos && <span aria-hidden className="h-[44px] w-[44px] shrink-0" />}
                  <span className={leading ? "font-bold" : "text-neutral-700"}>
                    {o.text}
                  </span>
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

            {/* 버튼 위에 덮는 사진. 여기만 누르면 확대, 나머지는 투표다. */}
            {withPhotos && (
              <div className="absolute top-1/2 left-3 z-10 h-[44px] w-[44px] -translate-y-1/2">
                <ZoomablePhoto
                  src={o.image_url}
                  alt=""
                  className="h-[44px] w-[44px]"
                  iconSize={14}
                />
              </div>
            )}
            </div>
          );
        })}
      </div>
      <p className="mt-2.5 text-center text-[13px] text-neutral-600">
        총 {poll.total_votes}표 · 다른 선택지를 누르면 표가 옮겨가요
      </p>
    </>
  );
}

/** ⑨ 무난함 판정 — 고정 2종. 작성자가 선택지를 만들 수 없다. */
function Nanhan({
  postId,
  nanhan,
  closed,
  onDone,
}: {
  postId: string;
  nanhan: NonNullable<PostDetail["nanhan"]>;
  closed: boolean;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  /**
   * 이미 고른 걸 다시 누르면 취소, 아니면 반대편으로 표를 옮긴다.
   *
   * 선택지투표와 달리 취소해도 %를 감추지 않는다. 무난함 %는 피드 배지에도
   * 그대로 나오는 공개 정보라, 여기서만 가린다고 감춰지지 않는다.
   */
  async function vote(choice: "무난해요" | "애매해요") {
    setBusy(true);
    const 취소 = choice === nanhan.my_choice;
    await (취소 ? clearNanhanVote(postId) : castNanhanVote(postId, choice)).catch(
      () => {},
    );
    await onDone();
    setBusy(false);
  }

  return (
    /*
      판정 묶음을 얇은 테두리로 따로 떼어낸다. 본문 바로 밑에 붙여두면
      숫자와 두 버튼이 글의 일부처럼 읽혀서 "여기서 눌러야 한다"가 안 보인다.
      본문과의 간격도 넉넉히 둔다 — 붙어 있으면 떼어낸 티가 안 난다.
    */
    <div className="mt-7 rounded-2xl border border-neutral-400 px-4 pt-4 pb-4">
      {/* 판사봉이 판정 전에는 들려 있고, 판정하고 나면 내려친 모양으로 바뀐다.
          글자만으로도 알 수 있지만 모양이 같이 바뀌면 눌린 게 더 확실해진다. */}
      <p className="flex items-center justify-center gap-2">
        {nanhan.revealed ? (
          <GavelDownIcon size={30} className="shrink-0 text-brand" />
        ) : (
          <GavelUpIcon size={30} className="shrink-0 text-brand" />
        )}
        <span className="cond text-[36px] leading-none font-bold text-brand">
          {!nanhan.revealed
            ? "무난함 판정"
            : nanhan.percent === null
              ? "아직 판정 전"
              : `무난함 ${nanhan.percent}%`}
        </span>
      </p>
      <div className="mt-3 flex gap-2">
        {(["무난해요", "애매해요"] as const).map((choice) => {
          const picked = nanhan.my_choice === choice;
          return (
            <button
              key={choice}
              type="button"
              // 종료된 글은 더 받지 않는다. DB도 막지만, 눌리는 것처럼
              // 보였다가 실패하면 고장으로 읽힌다.
              disabled={busy || closed}
              onClick={() => vote(choice)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-3 ${
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
                className={`text-[15px] font-bold ${
                  picked ? "text-brand-dark" : "text-neutral-600"
                }`}
              >
                {choice}
              </span>
              {/* 판정 전에는 표수도 안 보여준다. 남겨두면 그 숫자로 결과를
                  짐작하게 되어 감춘 의미가 없다. */}
              {nanhan.revealed && (
                <span
                  className={`cond text-[14px] font-semibold ${
                    picked ? "text-brand-dark" : "text-neutral-600"
                  }`}
                >
                  {nanhan[choice]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!nanhan.revealed && (
        <p className="mt-2.5 text-center text-[13px] text-neutral-600">
          판정하면 결과를 볼 수 있어요
        </p>
      )}
    </div>
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
  // 댓글에 붙일 사진 한 장. 올린 주소만 들고 있는다(업로드는 고를 때 끝난다).
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  // 답글을 달 대상. null이면 새 댓글.
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  // 답글은 접어둔다. 원댓글이 답글에 밀려 안 보이면 흐름을 못 따라간다.
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);

  // 서버는 평평한 목록을 추천순으로 준다. 답글을 부모 밑으로 다시 묶는다.
  // 답글끼리는 오래된 순 — 대화 순서가 뒤집히면 읽을 수가 없다.
  const roots = data.comments.filter((c) => c.parent_id === null);
  const repliesOf = new Map<string, Comment[]>();
  for (const c of data.comments) {
    if (!c.parent_id) continue;
    repliesOf.set(c.parent_id, [...(repliesOf.get(c.parent_id) ?? []), c]);
  }
  for (const list of repliesOf.values()) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async function submit() {
    // busy(state)만으로는 못 막는다. 같은 프레임에 두 번 불리면 둘 다 옛 값을
    // 읽어서 통과한다. 한글 IME는 Enter로 조합을 확정할 때 keydown을 두 번
    // 쏘기 때문에 실제로 댓글이 두 개 달렸다. ref는 즉시 반영되므로 여기서 막는다.
    // 사진만 올려도 된다 — 둘 다 없을 때만 막는다.
    if (submitting.current || (!draft.trim() && !photo)) return;
    submitting.current = true;
    setBusy(true);
    await addComment(postId, draft.trim(), replyTo?.id, photo).catch(() => {});
    setDraft("");
    setPhoto(null);
    // 답글을 달면 그 묶음을 펼쳐둔다. 접혀 있으면 방금 쓴 게 안 보인다.
    if (replyTo) setOpened((prev) => new Set(prev).add(replyTo.id));
    setReplyTo(null);
    await onDone();
    setBusy(false);
    submitting.current = false;
  }

  function startReply(c: Comment) {
    setReplyTo(c);
    inputRef.current?.focus();
  }

  async function toggleLike(c: Comment) {
    setBusy(true);
    await toggleCommentLike(c.id, c.liked_by_me).catch(() => {});
    await onDone();
    setBusy(false);
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <Kicker className="text-[13.5px]">COMMENTS {data.comments.length}</Kicker>
        {roots.length > 0 && (
          <span className="text-[13px] font-bold text-brand">추천순</span>
        )}
      </div>

      {roots.map((c) => {
        const replies = repliesOf.get(c.id) ?? [];
        const isOpen = opened.has(c.id);
        return (
          <div key={c.id} className="border-t border-dashed border-neutral-400">
            <CommentRow
              comment={c}
              busy={busy}
              onLike={() => toggleLike(c)}
              onReply={() => startReply(c)}
            />

            {replies.length > 0 && (
              <div className="pl-10">
                <button
                  type="button"
                  onClick={() =>
                    setOpened((prev) => {
                      const next = new Set(prev);
                      if (next.has(c.id)) next.delete(c.id);
                      else next.add(c.id);
                      return next;
                    })
                  }
                  className="flex items-center gap-2 py-1.5 text-[13px] font-semibold text-neutral-500"
                >
                  <span className="h-px w-5 bg-neutral-400" />
                  {isOpen ? "답글 숨기기" : `답글 ${replies.length}개 보기`}
                </button>

                {isOpen &&
                  replies.map((r) => (
                    <CommentRow
                      key={r.id}
                      comment={r}
                      busy={busy}
                      compact
                      onLike={() => toggleLike(r)}
                      onReply={() => startReply(c)}
                    />
                  ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="border-t border-neutral-400">
        {replyTo && (
          <div className="flex items-center gap-2 bg-neutral-100 px-4 py-1.5">
            <span className="flex-1 truncate text-[13px] text-neutral-600">
              {replyTo.nickname}님에게 답글 다는 중
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-[13px] font-bold text-neutral-500"
            >
              취소
            </button>
          </div>
        )}
        {/* 고른 사진 미리보기. 작게 둔다 — 입력줄이 사진에 밀리면 안 된다. */}
        {photo && (
          <div className="px-4 pt-2">
            <span className="relative inline-block">
              <PhotoBox src={photo} alt="" className="h-[56px] w-[56px]" />
              <button
                type="button"
                aria-label="사진 빼기"
                onClick={() => setPhoto(null)}
                className="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] leading-none text-white"
              >
                ×
              </button>
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 px-4 py-2">
          {/* 사진 한 장까지. 파일 선택창은 감춰두고 라벨로 감싼다. */}
          <label
            aria-label="사진 넣기"
            className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-neutral-400 text-neutral-500 ${
              uploading || photo ? "opacity-40" : ""
            }`}
          >
            <input
              type="file"
              accept="image/*"
              disabled={uploading || photo !== null}
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";        // 같은 파일을 다시 고를 수 있게
                if (!file) return;
                setUploading(true);
                try {
                  setPhoto(await uploadImage(file));
                } catch {
                  alert("사진을 올리지 못했어요.");
                }
                setUploading(false);
              }}
            />
            <ImageIcon size={17} />
          </label>

          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // isComposing이면 한글을 조합 중이라 Enter가 "확정"이지 "전송"이 아니다.
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              e.preventDefault();
              submit();
            }}
            placeholder={replyTo ? "답글을 남겨보세요" : "댓글을 남겨보세요"}
            className="flex-1 rounded-md border border-neutral-400 px-3 py-2 text-[14.5px]"
          />
          <button
            type="button"
            onClick={submit}
            // 사진만 올려도 된다. 둘 다 없을 때만 잠근다.
            disabled={busy || (!draft.trim() && !photo)}
            className="cond text-[14px] font-bold text-brand disabled:text-neutral-400"
          >
            등록
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * 댓글 한 줄 — 인스타 형태.
 * 본문은 왼쪽에 흐르고 좋아요는 오른쪽 끝에 세로로 붙는다(하트 + 개수).
 * 시간·좋아요 수·답글 달기는 본문 아래 한 줄에 모은다.
 */
function CommentRow({
  comment: c,
  busy,
  compact = false,
  onLike,
  onReply,
}: {
  comment: Comment;
  busy: boolean;
  compact?: boolean;
  onLike: () => void;
  onReply: () => void;
}) {
  return (
    <div className={`flex gap-2.5 px-4 ${compact ? "py-2" : "py-3"}`}>
      <Avatar nickname={c.nickname} size={compact ? 26 : 30} />

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {/* 고수 뱃지는 닉네임 왼쪽. 온도가 아니라 experts 소속으로 판별한다. */}
          {c.is_expert && <ExpertBadge />}
          <span className="text-[13.5px] font-semibold">{c.nickname}</span>
          <Temperature value={c.temperature} />
          {c.is_mine && <MineBadge />}
        </div>

        {/* 사진만 남긴 댓글은 본문이 빈 문자열이다. 빈 <p>를 그리면
            그만큼 줄 간격이 벌어져 사진이 아래로 떠 보인다. */}
        {c.body.trim() && (
          <p
            className={`leading-relaxed ${compact ? "text-[14.5px]" : "text-[15px]"}`}
          >
            {c.body}
          </p>
        )}

        {/*
          댓글 사진은 작게. 댓글은 대답이라 사진이 본문보다 커지면 누가
          무슨 말을 했는지가 사진에 묻힌다. 답글은 한 단계 더 작게 둔다.
          누르면 원본 비율로 크게 볼 수 있다.
        */}
        {c.image_url && (
          // 폭은 감싸개가 정한다. ZoomablePhoto 안쪽 버튼이 w-full이라
          // className으로 폭을 주면 둘이 부딪혀서 전체 폭으로 퍼진다.
          <span className={`mt-1.5 block ${compact ? "w-[112px]" : "w-[136px]"}`}>
            <ZoomablePhoto src={c.image_url} alt="" iconSize={16} natural />
          </span>
        )}

        <div className="mt-1.5 flex items-center gap-3 text-[12.5px] text-neutral-500">
          {c.likes > 0 && <span>좋아요 {c.likes}개</span>}
          <button type="button" onClick={onReply} className="font-semibold">
            답글 달기
          </button>
        </div>
      </div>

      {/* 내 댓글에는 버튼을 아예 그리지 않는다. 눌리지 않는 버튼을 남겨두면
          왜 안 되는지 알 수 없어서 고장으로 읽힌다. */}
      {!c.is_mine && (
        <button
          type="button"
          disabled={busy}
          onClick={onLike}
          aria-pressed={c.liked_by_me}
          aria-label={c.liked_by_me ? "좋아요 취소" : "좋아요"}
          className={`flex w-6 shrink-0 flex-col items-center gap-0.5 pt-0.5 ${
            c.liked_by_me ? "text-brand" : "text-neutral-500"
          }`}
        >
          <HeartIcon size={15} strokeWidth={c.liked_by_me ? 2.2 : 1.5} />
          {c.likes > 0 && <span className="cond text-[12px]">{c.likes}</span>}
        </button>
      )}
    </div>
  );
}

/**
 * 프로필 자리.
 *
 * 이 앱에는 사진 업로드가 없다(닉네임만 있는 익명 서비스). 그래도 자리를
 * 비워두면 댓글이 전부 한 덩어리로 보여서 누가 말했는지 눈으로 안 갈린다.
 * 닉네임의 동물 글자를 넣어 최소한의 구분을 준다 —
 * "정갈한 여우 #0192" → 여
 */
function Avatar({ nickname, size = 30 }: { nickname: string; size?: number }) {
  const parts = nickname.trim().split(/\s+/);
  const ch = (parts[1] ?? parts[0] ?? "?").charAt(0);

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-tint font-semibold text-brand-dark"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {ch}
    </span>
  );
}

/**
 * 글 우상단 메뉴.
 *
 * 내 글이면 삭제, 남의 글이면 신고. 둘을 같이 보여주지 않는다 —
 * 내 글을 신고하거나 남의 글을 지우는 건 애초에 불가능해서,
 * 눌리지 않는 항목을 늘어놓을 이유가 없다.
 */
function PostMenu({
  postId,
  isMine,
  canClose,
  onDone,
}: {
  postId: string;
  isMine: boolean;
  canClose: boolean;
  onDone: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function close() {
    // 되돌릴 수 없다. 지우기와 같은 무게라 한 번 더 묻는다.
    if (!confirm("투표를 종료할까요? 결과가 공개되고 다시 열 수 없어요.")) return;
    setBusy(true);
    try {
      await closePost(postId);
      setOpen(false);
      await onDone();
    } catch {
      alert("종료하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
    setBusy(false);
  }

  async function remove() {
    // 지우면 되돌릴 수 없다. 한 번 더 묻는다.
    if (!confirm("이 글을 삭제할까요? 댓글도 함께 사라져요.")) return;
    setBusy(true);
    try {
      await deletePost(postId);
      // replace로 나간다 — 뒤로가기로 사라진 글에 돌아오면 404가 뜬다.
      router.replace("/");
    } catch {
      setBusy(false);
      alert("삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  async function report() {
    setBusy(true);
    try {
      await reportPost(postId);
      setDone(true);
      setTimeout(() => setOpen(false), 1200);
    } catch {
      alert("신고하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
    setBusy(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="더보기"
        aria-haspopup="menu"
        className="transition-transform duration-100 active:scale-90"
      >
        <MoreIcon size={20} />
      </button>

      {open && (
        <>
          {/* 바깥을 누르면 닫힌다. 시트보다 아래에 깔린다. */}
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-ink/25"
          />
          <div
            role="menu"
            // 홈 인디케이터가 닫기 버튼을 덮지 않게 아래 여백을 안전 영역만큼 준다.
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] rounded-t-2xl bg-bg p-3 pb-[max(1.25rem,var(--safe-bottom))]"
          >
            {done ? (
              <p className="py-4 text-center text-[15px] font-bold text-brand">
                신고가 접수됐어요
              </p>
            ) : isMine ? (
              <>
                {canClose && (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={busy}
                    onClick={close}
                    className="flex w-full items-center gap-2.5 rounded-lg px-4 py-3.5 text-[16px] font-semibold disabled:opacity-50"
                  >
                    <CheckIcon size={19} />
                    투표 종료하기
                  </button>
                )}
                <Link
                  href={`/post/${postId}/edit`}
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 rounded-lg px-4 py-3.5 text-[16px] font-semibold"
                >
                  <PencilIcon size={19} />
                  글 수정하기
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  onClick={remove}
                  className="flex w-full items-center gap-2.5 rounded-lg px-4 py-3.5 text-[16px] font-semibold text-danger disabled:opacity-50"
                >
                  <TrashIcon size={19} />
                  글 삭제하기
                </button>
              </>
            ) : (
              <button
                type="button"
                role="menuitem"
                disabled={busy}
                onClick={report}
                className="flex w-full items-center gap-2.5 rounded-lg px-4 py-3.5 text-[16px] font-semibold text-danger disabled:opacity-50"
              >
                <SirenIcon size={19} />
                글 신고하기
              </button>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-1 w-full rounded-lg px-4 py-3 text-[15px] font-semibold text-neutral-600"
            >
              닫기
            </button>
          </div>
        </>
      )}
    </>
  );
}

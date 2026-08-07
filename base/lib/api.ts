"use client";

/**
 * 커뮤니티 API 클라이언트.
 * 모든 요청에 X-Device-Id가 실린다 — 서버는 이 헤더로만 신원을 판별한다(F-04).
 * device_id는 응답에 담기지 않고 대신 is_mine이 온다.
 */

import { apiFetch, getOrCreateDeviceId } from "@/lib/device";
import type { Category, PostType } from "@/lib/constants";

export type FeedItem = {
  id: string;
  category: Category;
  post_type: PostType;
  title: string;
  body: string;
  created_at: string;
  /** 마지막으로 고친 시각. 기록만 하고 화면에는 안 띄운다. */
  edited_at: string | null;
  nickname: string;
  temperature: number;
  /** experts에 등록된 사람인지. 온도 42도를 넘겼다고 고수인 게 아니다. */
  is_expert: boolean;
  thumbnail_url: string | null;
  /**
   * 투표글의 선택지 사진 (sort_order 순).
   *
   * `thumbnail_url`과 별개다 — 투표글은 본문 사진칸이 없고 사진이
   * `poll_options.image_url`에 붙어서 뷰의 썸네일에 안 잡힌다.
   * 투표글이 아니면 빈 배열이다.
   */
  option_images: string[];
  comment_count: number;
  reaction_count: number;
  /** 판정 전에는 null. 종료됐거나 내가 판정한 글만 값이 온다. */
  nanhan_percent: number | null;
  /** 글쓴이가 손으로 닫은 시각. 72시간이 지나 저절로 닫힌 경우는 null이다. */
  closed_at: string | null;
  /** 실제로 닫히는(닫힌) 시각 — 손으로 닫았으면 그때, 아니면 올린 지 72시간 뒤. */
  closes_at: string;
  /** 지금 닫혀 있나. 손으로 닫았든 시간이 지났든 이 값 하나만 보면 된다. */
  is_closed: boolean;
  is_mine: boolean;
};

export type PollOption = {
  id: string;
  text: string;
  sort_order: number;
  /** 선택지 사진. 없으면 null — 사진 없는 투표도 올릴 수 있다. */
  image_url: string | null;
  /** 투표 전에는 null — 결과를 서버에서부터 감춘다(F-32) */
  vote_count: number | null;
  percent: number | null;
};

export type PostDetail = {
  post: FeedItem & { images: { id: string; url: string }[] };
  poll: {
    total_votes: number;
    my_option_id: string | null;
    revealed: boolean;
    options: PollOption[];
  } | null;
  nanhan: {
    // 판정 전에는 전부 null — 서버에서부터 감춘다(F-32와 같은 규칙).
    무난해요: number | null;
    애매해요: number | null;
    total_votes: number | null;
    my_choice: "무난해요" | "애매해요" | null;
    revealed: boolean;
    percent: number | null;
  } | null;
  likes: { count: number; liked_by_me: boolean } | null;
  comments: Comment[];
};

export type Comment = {
  id: string;
  body: string;
  likes: number;
  created_at: string;
  nickname: string;
  temperature: number;
  /** experts에 등록된 사람인지. 온도로 판별하면 안 된다. */
  is_expert: boolean;
  /** 답글이면 부모 댓글 id. 최상위 댓글이면 null. */
  parent_id: string | null;
  /** 댓글에 붙인 사진 한 장. 없으면 null. */
  image_url: string | null;
  liked_by_me: boolean;
  is_mine: boolean;
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? "REQUEST_FAILED", res.status, body.detail);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    public detail?: string,
  ) {
    super(code);
  }
}

/**
 * 도서관 무난템 카드.
 *
 * `vouch_count`·`nanhan_percent`는 저장값이 아니라 매인 판정글의 표를 그대로
 * 센 값이다. 카드가 들고 있는 건 사람이 정리한 부분(이름·가격대·왜 무난한가)뿐.
 */
export type PickItem = {
  id: string;
  /** 판정의 근거가 된 글. 카드를 누르면 여기로 간다 */
  post_id: string;
  name: string;
  price_band: string;
  one_liner: string;
  why: string;
  thumb_url: string;
  tags: string[];
  category: Category;
  post_title: string;
  vouch_count: number;
  vote_count: number;
  nanhan_percent: number;
};

export async function fetchPicks(params: { category?: Category; limit?: number } = {}) {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.limit) q.set("limit", String(params.limit));
  const res = await apiFetch(`/api/picks?${q}`);
  const { items } = await json<{ items: PickItem[] }>(res);
  return items;
}

export async function fetchFeed(params: {
  category?: Category;
  post_type?: PostType;
  /** 도서관 전용. 피드는 최신순 고정이다(F-13). */
  sort?: "latest" | "reactions";
  /** 도서관 무난템 전용 — 무난함 % 하한. */
  min_nanhan?: number;
  /** 제목·본문 검색어. */
  q?: string;
  /** 종료된 투표만 (도서관 무난템 서가). */
  closed?: boolean;
  /** 표가 이만큼 이상 모인 글만 (도서관 무난템 서가). */
  min_votes?: number;
  limit?: number;
}): Promise<FeedItem[]> {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.post_type) q.set("post_type", params.post_type);
  if (params.sort) q.set("sort", params.sort);
  if (params.min_nanhan) q.set("min_nanhan", String(params.min_nanhan));
  if (params.q) q.set("q", params.q);
  if (params.closed) q.set("closed", "true");
  if (params.min_votes) q.set("min_votes", String(params.min_votes));
  if (params.limit) q.set("limit", String(params.limit));
  const res = await apiFetch(`/api/posts?${q}`);
  const { items } = await json<{ items: FeedItem[] }>(res);
  return items;
}

export async function fetchPost(id: string): Promise<PostDetail> {
  return json<PostDetail>(await apiFetch(`/api/posts/${id}`));
}

export async function fetchMyPosts(): Promise<FeedItem[]> {
  const { items } = await json<{ items: FeedItem[] }>(
    await apiFetch("/api/users/me/posts"),
  );
  return items;
}

export type MyComment = {
  id: string;
  body: string;
  likes: number;
  created_at: string;
  post: { id: string; title: string; category: Category; post_type: PostType } | null;
};

export async function fetchMyComments(): Promise<MyComment[]> {
  const { items } = await json<{ items: MyComment[] }>(
    await apiFetch("/api/users/me/comments"),
  );
  return items;
}

/**
 * 사진 업로드. Content-Type은 브라우저가 boundary까지 붙여서 정해야 하므로
 * apiFetch의 기본 헤더를 쓰지 않고 직접 만든다.
 */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/uploads", {
    method: "POST",
    headers: { "X-Device-Id": getOrCreateDeviceId() },
    body: form,
  });
  const { url } = await json<{ url: string }>(res);
  return url;
}

export async function createPost(input: {
  category: Category;
  post_type: PostType;
  title: string;
  body: string;
  options?: string[];
  /** 선택지와 나란한 배열. 사진을 안 고른 자리는 null. */
  option_images?: (string | null)[];
  image_urls?: string[];
}): Promise<{ id: string }> {
  return json<{ id: string }>(
    await apiFetch("/api/posts", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function castPollVote(postId: string, optionId: string) {
  return json(
    await apiFetch(`/api/posts/${postId}/poll-vote`, {
      method: "POST",
      body: JSON.stringify({ option_id: optionId }),
    }),
  );
}

/** 투표 취소 — 같은 선택지를 다시 누르면 표를 뺀다. 결과도 다시 감춰진다. */
export async function clearPollVote(postId: string) {
  return json(
    await apiFetch(`/api/posts/${postId}/poll-vote`, { method: "DELETE" }),
  );
}

export async function castNanhanVote(
  postId: string,
  choice: "무난해요" | "애매해요",
) {
  return json(
    await apiFetch(`/api/posts/${postId}/nanhan-vote`, {
      method: "POST",
      body: JSON.stringify({ choice }),
    }),
  );
}

/** 판정 취소 — 같은 버튼을 다시 누르면 표를 뺀다. */
export async function clearNanhanVote(postId: string) {
  return json(
    await apiFetch(`/api/posts/${postId}/nanhan-vote`, { method: "DELETE" }),
  );
}

export async function addComment(
  postId: string,
  body: string,
  parentId?: string,
  imageUrl?: string | null,
) {
  return json(
    await apiFetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({
        body,
        parent_id: parentId,
        image_url: imageUrl ?? undefined,
      }),
    }),
  );
}

/**
 * 내 글 수정 — 제목과 본문만.
 * 유형·선택지·카테고리는 서버가 거부한다(쌓인 표가 갈 곳을 잃는다).
 */
export async function updatePost(
  postId: string,
  patch: { title: string; body: string },
) {
  return json<{ id: string; edited: boolean }>(
    await apiFetch(`/api/posts/${postId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  );
}

/**
 * 투표 종료 — 글쓴이만. 되돌릴 수 없다.
 * 종료하면 결과가 모두에게 공개되고 표는 더 받지 않는다.
 */
export async function closePost(postId: string) {
  return json<{ id: string; closed_at: string }>(
    await apiFetch(`/api/posts/${postId}/close`, { method: "POST" }),
  );
}

/** 내 글 삭제. 사진·투표·댓글은 DB가 연쇄로 지운다. */
export async function deletePost(postId: string) {
  return json(await apiFetch(`/api/posts/${postId}`, { method: "DELETE" }));
}

/** 남의 글 신고. 기록만 남고 글이 자동으로 내려가지는 않는다. */
export async function reportPost(postId: string, reason?: string) {
  return json<{ reported: boolean; duplicated?: boolean }>(
    await apiFetch(`/api/posts/${postId}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  );
}

/**
 * 정보 공유 글 좋아요 (F-80).
 * 이 좋아요는 글쓴이 온도에 ×0.2로 쌓인다 — 서버 트리거가 자가 좋아요를 막는다.
 */
export async function togglePostLike(postId: string, liked: boolean) {
  return json(
    await apiFetch(`/api/posts/${postId}/like`, {
      method: liked ? "DELETE" : "POST",
    }),
  );
}

export async function toggleCommentLike(commentId: string, liked: boolean) {
  return json(
    await apiFetch(`/api/comments/${commentId}/like`, {
      method: liked ? "DELETE" : "POST",
    }),
  );
}

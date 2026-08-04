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
  nickname: string;
  temperature: number;
  thumbnail_url: string | null;
  comment_count: number;
  reaction_count: number;
  nanhan_percent: number | null;
  is_mine: boolean;
};

export type PollOption = {
  id: string;
  text: string;
  sort_order: number;
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
    무난해요: number;
    애매해요: number;
    total_votes: number;
    my_choice: "무난해요" | "애매해요" | null;
    percent: number | null;
  } | null;
  likes: { count: number; liked_by_me: boolean } | null;
  comments: {
    id: string;
    body: string;
    likes: number;
    created_at: string;
    nickname: string;
    temperature: number;
    liked_by_me: boolean;
    is_mine: boolean;
  }[];
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

export async function fetchFeed(params: {
  category?: Category;
  post_type?: PostType;
  /** 도서관 전용. 피드는 최신순 고정이다(F-13). */
  sort?: "latest" | "reactions";
  limit?: number;
}): Promise<FeedItem[]> {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.post_type) q.set("post_type", params.post_type);
  if (params.sort) q.set("sort", params.sort);
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

export async function addComment(postId: string, body: string) {
  return json(
    await apiFetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
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

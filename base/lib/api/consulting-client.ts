"use client";

/**
 * 컨설팅 API 클라이언트.
 * 모든 요청에 X-Device-Id가 실린다 — 서버는 이 헤더로만 신원을 판별한다(F-04).
 * 응답에 device_id는 오지 않고, 대신 is_owner / is_expert가 온다.
 */

import { apiFetch } from "@/lib/device";
import { ApiError } from "@/lib/api";
import type { BookingStatus, OutfitSlot } from "@/lib/constants";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? "UNKNOWN", res.status, body.detail);
  }
  return res.json() as Promise<T>;
}

export type ExpertListItem = {
  id: string;
  nickname: string;
  temperature: number;
  specialty: string;
  intro: string;
  price: number;
  rating: number | null;
  review_count: number;
  answered_count: number;
};

export type ExpertDetail = ExpertListItem & {
  highlights: { body: string; likes: number; post_id: string; post_title: string }[];
  reviews: { rating: number; body: string | null }[];
};

export type OutfitItem = {
  slot: OutfitSlot;
  url: string;
  alt_url: string | null;
  brand: string | null;
  name: string;
  price: number;
  reason: string;
};

export type ConsultingAnswer = {
  id: string;
  round: 1 | 2;
  diagnosis: string;
  avoid: string[];
  items: OutfitItem[];
  total: number;
  /** 이 회차에 달린 피드백. 아직 안 받았으면 null. */
  feedback: { kind: "만족" | "수정요청"; reason: string | null } | null;
};

export type BookingDetail = {
  id: string;
  status: BookingStatus;
  purpose: string;
  budget: number;
  concerns: string[];
  body_note: string;
  style_note: string;
  price: number;
  revision_count: number;
  /** 가장 최근 수정 요청 사유. 고수가 확정안을 쓸 때 반드시 보여야 한다. */
  revision_reason: string | null;
  created_label: string;
  due_label: string;
  expert: { id: string; nickname: string; temperature: number; intro: string };
  images: { kind: "전신" | "착장"; url: string }[];
  answers: ConsultingAnswer[];
  is_owner: boolean;
  is_expert: boolean;
};

export type BookingListItem = {
  id: string;
  status: BookingStatus;
  purpose: string;
  budget: number;
  created_label: string;
  due_label: string;
  expert: { id: string; nickname: string; temperature: number };
};

export type ExpertInboxItem = {
  id: string;
  status: BookingStatus;
  purpose: string;
  budget: number;
  concerns: string[];
  created_label: string;
  due_label: string;
  needs_answer: boolean;
};

export async function fetchExperts(): Promise<ExpertListItem[]> {
  const { items } = await json<{ items: ExpertListItem[] }>(
    await apiFetch("/api/experts"),
  );
  return items;
}

export async function fetchExpert(id: string): Promise<ExpertDetail> {
  return json<ExpertDetail>(await apiFetch(`/api/experts/${id}`));
}

export async function fetchMyBookings(): Promise<BookingListItem[]> {
  const { items } = await json<{ items: BookingListItem[] }>(
    await apiFetch("/api/bookings"),
  );
  return items;
}

export async function fetchBooking(id: string): Promise<BookingDetail> {
  return json<BookingDetail>(await apiFetch(`/api/bookings/${id}`));
}

export async function createBooking(input: {
  expert_id: string;
  purpose: string;
  budget: number;
  concerns: string[];
  body_note: string;
  style_note: string;
  body_images: string[];
  outfit_images: string[];
}): Promise<{ id: string }> {
  // 금액은 보내지 않는다 — 서버가 experts.price에서 읽는다.
  return json<{ id: string }>(
    await apiFetch("/api/bookings", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function sendFeedback(
  bookingId: string,
  kind: "만족" | "수정요청",
  reason?: string,
): Promise<{ status: BookingStatus }> {
  return json<{ status: BookingStatus }>(
    await apiFetch(`/api/bookings/${bookingId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ kind, reason }),
    }),
  );
}

export async function fetchExpertInbox(): Promise<{
  expert_id: string;
  items: ExpertInboxItem[];
}> {
  return json(await apiFetch("/api/experts/me/bookings"));
}

export async function submitAnswer(
  bookingId: string,
  input: {
    diagnosis: string;
    avoid: string[];
    items: {
      slot: OutfitSlot;
      url: string;
      alt_url?: string;
      brand?: string;
      name: string;
      price: number;
      reason: string;
    }[];
  },
): Promise<{ id: string; round: number }> {
  return json(
    await apiFetch(`/api/bookings/${bookingId}/answer`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

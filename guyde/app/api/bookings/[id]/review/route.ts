import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, fromDbError, getDeviceId, ok } from "@/lib/api/http";

/**
 * 컨설팅 후기.
 *
 * 끝난 건에만, 신청자만, 한 번만 쓸 수 있다.
 *   - 진행 중에 후기를 받으면 답변을 보기도 전에 별점이 붙는다.
 *   - 고수가 자기 건에 후기를 달 수 있으면 평점이 의미를 잃는다.
 *   - 한 건에 여러 개면 같은 컨설팅으로 평점을 여러 번 올릴 수 있다
 *     (reviews_booking_uniq 인덱스가 DB에서도 막는다).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const { id } = await params;

  let body: { rating?: number; body?: string };
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_JSON", 400);
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return fail("INVALID_RATING", 400, "별점을 1~5 중에서 골라주세요");
  }

  const db = createAdminClient();

  const { data: booking, error: bookingError } = await db
    .from("bookings")
    .select("id, device_id, expert_id, status")
    .eq("id", id)
    .maybeSingle();
  if (bookingError) return fail("DB_ERROR", 500, bookingError.message);
  if (!booking) return fail("BOOKING_NOT_FOUND", 404);

  // 남의 건은 없는 것처럼 다룬다 — 403이면 그 건이 있다는 사실이 새어 나간다.
  if (booking.device_id !== deviceId) return fail("BOOKING_NOT_FOUND", 404);

  if (booking.status !== "완료") {
    return fail("NOT_CLOSED_YET", 409, "컨설팅이 끝난 뒤에 남길 수 있어요");
  }

  const { data: existing } = await db
    .from("reviews")
    .select("id")
    .eq("booking_id", id)
    .maybeSingle();
  if (existing) return fail("ALREADY_REVIEWED", 409, "이미 후기를 남겼어요");

  const { error } = await db.from("reviews").insert({
    booking_id: id,
    expert_id: booking.expert_id,
    device_id: deviceId,
    rating,
    body: body.body?.trim() || null,
  });
  if (error) return fromDbError(error.message);

  return ok({ rating }, 201);
}

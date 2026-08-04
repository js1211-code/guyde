import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, fromDbError, getDeviceId, ok } from "@/lib/api/http";
import {
  OUTFIT_REASON_MIN,
  OUTFIT_SLOTS,
  REVISION_MAX,
  type OutfitSlot,
} from "@/lib/constants";

type ItemInput = {
  slot?: string;
  url?: string;
  alt_url?: string;
  brand?: string;
  name?: string;
  price?: number;
  reason?: string;
};

/**
 * 고수 답변 작성 (화면 ㉘).
 *
 * 회차는 서버가 정한다. 클라이언트가 round를 보내면 2회차를 건너뛰거나
 * 1회차를 덮어쓸 수 있다.
 *   '신청 접수'   → 1회차 → 상태 '답변 도착'
 *   '수정 요청됨' → 2회차(확정안) → 상태 '답변 도착'
 *
 * 착장은 상의·하의·신발 셋 다 있어야 한다. 하나라도 비면 "입을 수 있는 한 벌"이
 * 아니라서 받는 쪽이 결국 스스로 채워야 한다 — 그러면 컨설팅이 아니다.
 * 이유 20자 최소는 DB CHECK에도 있지만 여기서 먼저 걸러 메시지를 제대로 준다.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const { id } = await params;

  let body: { diagnosis?: string; avoid?: string[]; items?: ItemInput[] };
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_JSON", 400);
  }

  const db = createAdminClient();

  const { data: booking, error: bookingError } = await db
    .from("bookings")
    .select("id, expert_id, status, revision_count")
    .eq("id", id)
    .maybeSingle();
  if (bookingError) return fail("DB_ERROR", 500, bookingError.message);
  if (!booking) return fail("BOOKING_NOT_FOUND", 404);

  const { data: expert } = await db
    .from("experts")
    .select("device_id")
    .eq("id", booking.expert_id)
    .maybeSingle();

  // 담당 고수만 쓸 수 있다. 남의 건에 답을 다는 순간 이 서비스는 끝난다.
  if (!expert || expert.device_id !== deviceId) {
    return fail("NOT_YOUR_BOOKING", 403, "이 컨설팅의 담당 고수가 아니에요");
  }

  const round = booking.status === "수정 요청됨" ? 2 : 1;
  if (booking.status === "답변 도착") {
    return fail("ALREADY_ANSWERED", 409, "이미 답변을 보냈어요");
  }
  if (booking.status === "완료") {
    return fail("BOOKING_CLOSED", 409, "이미 끝난 컨설팅이에요");
  }
  if (round === 2 && (booking.revision_count ?? 0) > REVISION_MAX) {
    return fail("REVISION_LIMIT", 409);
  }

  const diagnosis = body.diagnosis?.trim() ?? "";
  if (diagnosis.length < OUTFIT_REASON_MIN) {
    return fail("DIAGNOSIS_TOO_SHORT", 400, `진단을 ${OUTFIT_REASON_MIN}자 이상 적어주세요`);
  }

  const avoid = (body.avoid ?? []).map((a) => a.trim()).filter(Boolean);
  if (avoid.length === 0) {
    return fail("AVOID_REQUIRED", 400, "피해야 할 것을 최소 1개 적어주세요");
  }

  // 슬롯별로 정확히 하나씩. 중복도 누락도 여기서 잡는다.
  const items = body.items ?? [];
  const bySlot = new Map<string, ItemInput>();
  for (const item of items) {
    if (!OUTFIT_SLOTS.includes(item.slot as OutfitSlot)) {
      return fail("INVALID_SLOT", 400, `착장 칸은 ${OUTFIT_SLOTS.join("·")}만 있어요`);
    }
    if (bySlot.has(item.slot!)) {
      return fail("DUPLICATE_SLOT", 400, `${item.slot}이 두 번 들어왔어요`);
    }
    bySlot.set(item.slot!, item);
  }

  for (const slot of OUTFIT_SLOTS) {
    const item = bySlot.get(slot);
    if (!item) return fail("SLOT_MISSING", 400, `${slot}를 채워주세요`);
    if (!item.url?.trim()) return fail("URL_REQUIRED", 400, `${slot} 구매 링크가 필요해요`);
    if (!item.name?.trim()) return fail("NAME_REQUIRED", 400, `${slot} 상품명이 필요해요`);
    if (!Number.isFinite(item.price) || (item.price as number) < 0) {
      return fail("PRICE_REQUIRED", 400, `${slot} 가격이 필요해요`);
    }
    if ((item.reason?.trim().length ?? 0) < OUTFIT_REASON_MIN) {
      return fail(
        "REASON_TOO_SHORT",
        400,
        `${slot}를 왜 골랐는지 ${OUTFIT_REASON_MIN}자 이상 적어주세요`,
      );
    }
  }

  const { data: answer, error } = await db
    .from("consulting_answers")
    .insert({ booking_id: id, round, diagnosis, avoid })
    .select("id")
    .single();
  if (error) return fromDbError(error.message);

  const { error: itemError } = await db.from("outfit_items").insert(
    OUTFIT_SLOTS.map((slot) => {
      const item = bySlot.get(slot)!;
      return {
        answer_id: answer.id,
        slot,
        url: item.url!.trim(),
        alt_url: item.alt_url?.trim() || null,
        brand: item.brand?.trim() || null,
        name: item.name!.trim(),
        price: Math.round(item.price as number),
        reason: item.reason!.trim(),
      };
    }),
  );
  if (itemError) {
    // 아이템이 없는 답변은 화면에서 빈 착장으로 보인다. 통째로 되돌린다.
    await db.from("consulting_answers").delete().eq("id", answer.id);
    return fromDbError(itemError.message);
  }

  const { error: statusError } = await db
    .from("bookings")
    .update({ status: "답변 도착", answered_at: new Date().toISOString() })
    .eq("id", id);
  if (statusError) return fail("DB_ERROR", 500, statusError.message);

  return ok({ id: answer.id, round }, 201);
}

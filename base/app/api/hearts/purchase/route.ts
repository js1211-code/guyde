import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, getDeviceId, ok } from "@/lib/api/http";
import { getPack, packTotal } from "@/lib/hearts";

/**
 * 하트 충전.
 *
 * ⚠️ 결제 PG를 붙이지 않았다(스코프 밖). 지금은 구매를 누르면 바로 지급된다.
 * 실제 결제를 붙일 때는 이 핸들러 앞에 결제 승인 확인이 들어가야 한다.
 *
 * 지급량은 클라이언트가 보내는 숫자를 믿지 않고 서버의 팩 정의에서 가져온다.
 * 안 그러면 헤더 하나 바꿔서 원하는 만큼 받아갈 수 있다.
 */
export async function POST(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  let packId: string | undefined;
  try {
    ({ pack_id: packId } = await req.json());
  } catch {
    return fail("INVALID_JSON", 400);
  }

  const pack = packId ? getPack(packId) : null;
  if (!pack) return fail("UNKNOWN_PACK", 400);

  const amount = packTotal(pack);
  const db = createAdminClient();

  /*
   * PostgREST로는 `hearts = hearts + n` 을 직접 못 쓴다.
   * 읽고 쓰면 동시 구매에서 한 건이 덮여 사라질 수 있으므로,
   * "읽은 값 그대로일 때만 쓴다"(compare-and-swap)로 걸고 실패하면 다시 읽는다.
   */
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = await db
      .from("users")
      .select("hearts")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (before.error) return fail("DB_ERROR", 500, before.error.message);
    if (!before.data) return fail("USER_NOT_FOUND", 404);

    const next = before.data.hearts + amount;
    const updated = await db
      .from("users")
      .update({ hearts: next })
      .eq("device_id", deviceId)
      .eq("hearts", before.data.hearts) // 그새 바뀌었으면 0행 → 재시도
      .select("hearts")
      .maybeSingle();

    if (updated.error) return fail("DB_ERROR", 500, updated.error.message);
    if (!updated.data) continue;

    await db.from("heart_transactions").insert({
      device_id: deviceId,
      delta: amount,
      reason: `purchase:${pack.id}`,
      balance_after: updated.data.hearts,
    });

    return ok({
      hearts: updated.data.hearts,
      granted: amount,
      pack_id: pack.id,
    });
  }

  return fail("PURCHASE_CONFLICT", 409, "다시 시도해주세요");
}

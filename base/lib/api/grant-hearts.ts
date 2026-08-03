import type { createAdminClient } from "@/lib/supabase/admin";

type Db = ReturnType<typeof createAdminClient>;

export type GrantResult =
  | { ok: true; hearts: number }
  | { ok: false; code: "USER_NOT_FOUND" | "CONFLICT" | "DB_ERROR"; detail?: string };

/**
 * 하트를 지급하고 원장에 남긴다. 구매·광고 보상이 같이 쓴다.
 *
 * PostgREST로는 `hearts = hearts + n` 을 직접 못 쓴다. 그냥 읽고 쓰면
 * 동시 요청 한 건이 조용히 덮이므로, "읽은 값 그대로일 때만 쓴다"로 걸고
 * 어긋나면 다시 읽는다(compare-and-swap).
 */
export async function grantHearts(
  db: Db,
  deviceId: string,
  amount: number,
  reason: string,
): Promise<GrantResult> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = await db
      .from("users")
      .select("hearts")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (before.error) return { ok: false, code: "DB_ERROR", detail: before.error.message };
    if (!before.data) return { ok: false, code: "USER_NOT_FOUND" };

    const updated = await db
      .from("users")
      .update({ hearts: before.data.hearts + amount })
      .eq("device_id", deviceId)
      .eq("hearts", before.data.hearts) // 그새 바뀌었으면 0행 → 재시도
      .select("hearts")
      .maybeSingle();

    if (updated.error) return { ok: false, code: "DB_ERROR", detail: updated.error.message };
    if (!updated.data) continue;

    await db.from("heart_transactions").insert({
      device_id: deviceId,
      delta: amount,
      reason,
      balance_after: updated.data.hearts,
    });

    return { ok: true, hearts: updated.data.hearts };
  }

  return { ok: false, code: "CONFLICT" };
}

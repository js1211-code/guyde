import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fromDbError, getDeviceId, ok } from "@/lib/api/http";

/**
 * F-42 댓글 추천 — 1인 1회, 재클릭 시 취소(DELETE).
 * 자기 댓글 추천은 DB 트리거(block_self_like)가 막고,
 * comments.likes는 트리거가 자동으로 맞춘다 — 여기서 직접 update 하지 않는다.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const { id } = await ctx.params;
  const db = createAdminClient();

  const { error } = await db
    .from("comment_likes")
    .insert({ comment_id: id, device_id: deviceId });

  // 이미 추천했으면 그대로 둔다(멱등).
  if (error && error.code !== "23505") return fromDbError(error.message);

  return ok({ comment_id: id, liked: true });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const { id } = await ctx.params;
  const db = createAdminClient();

  const { error } = await db
    .from("comment_likes")
    .delete()
    .eq("comment_id", id)
    .eq("device_id", deviceId);

  if (error) return fromDbError(error.message);
  return ok({ comment_id: id, liked: false });
}

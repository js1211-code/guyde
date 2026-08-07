import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fromDbError, getDeviceId, ok } from "@/lib/api/http";

/**
 * F-38 정보 공유 글 좋아요 — 1기기 1회, 재클릭 시 취소(DELETE).
 *
 * 두 가지를 DB 트리거가 막는다:
 *  - 자기 글 좋아요
 *  - 정보 공유가 아닌 글에 좋아요 (질문으로 온도가 오르는 경로를 만들면 안 됨)
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
    .from("post_likes")
    .insert({ post_id: id, device_id: deviceId });

  // 이미 눌렀으면 그냥 눌린 상태로 둔다(멱등).
  if (error && error.code !== "23505") return fromDbError(error.message);

  return ok({ post_id: id, liked: true });
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
    .from("post_likes")
    .delete()
    .eq("post_id", id)
    .eq("device_id", deviceId);

  if (error) return fromDbError(error.message);
  return ok({ post_id: id, liked: false });
}

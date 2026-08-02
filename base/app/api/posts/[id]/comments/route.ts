import { createAdminClient } from "@/lib/supabase/admin";
import {
  deviceRequired,
  fail,
  fromDbError,
  getDeviceId,
  ok,
} from "@/lib/api/http";

/**
 * F-40 댓글 작성 — 1단계만. 대댓글이 없어서 parent_id가 없다.
 * 댓글 목록은 글 상세(GET /api/posts/[id])가 정렬까지 해서 함께 내려준다.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const { id } = await ctx.params;
  let body: string | undefined;
  try {
    ({ body } = await req.json());
  } catch {
    return fail("INVALID_JSON", 400);
  }
  if (!body?.trim()) return fail("BODY_REQUIRED", 400);

  const db = createAdminClient();
  const { data, error } = await db
    .from("comments")
    .insert({ post_id: id, device_id: deviceId, body: body.trim() })
    .select("id, body, likes, created_at")
    .single();

  if (error) return fromDbError(error.message);
  return ok(data, 201);
}

import { createAdminClient } from "@/lib/supabase/admin";
import {
  deviceRequired,
  fail,
  fromDbError,
  getDeviceId,
  ok,
} from "@/lib/api/http";

/**
 * F-40 댓글 작성. parent_id를 주면 답글이 된다.
 *
 * 깊이는 1단계까지다 — 답글에 답글을 달면 모바일 폭에서 계속 안으로 밀려
 * 읽을 수 없게 된다. 제한은 DB 트리거(block_nested_reply)가 강제하므로
 * 여기서는 그 예외를 사람이 읽을 수 있는 메시지로 옮기기만 한다.
 *
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
  let parentId: string | undefined;
  try {
    ({ body, parent_id: parentId } = await req.json());
  } catch {
    return fail("INVALID_JSON", 400);
  }
  if (!body?.trim()) return fail("BODY_REQUIRED", 400);

  const db = createAdminClient();
  const { data, error } = await db
    .from("comments")
    .insert({
      post_id: id,
      device_id: deviceId,
      body: body.trim(),
      parent_id: parentId ?? null,
    })
    .select("id, body, likes, created_at, parent_id")
    .single();

  if (error) return fromDbError(error.message);
  return ok(data, 201);
}

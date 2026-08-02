import { createAdminClient } from "@/lib/supabase/admin";
import {
  deviceRequired,
  fail,
  fromDbError,
  getDeviceId,
  ok,
} from "@/lib/api/http";

/**
 * F-33 선택지 투표 — 1기기 1표.
 * 다른 선택지를 누르면 표가 그쪽으로 이동한다(cast_poll_vote가 upsert).
 * 같은 선택지 재클릭은 취소 없이 유지.
 * 교차 글 투표(다른 글의 option_id)는 복합 FK가 DB에서 막는다.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const { id } = await ctx.params;
  let optionId: string | undefined;
  try {
    ({ option_id: optionId } = await req.json());
  } catch {
    return fail("INVALID_JSON", 400);
  }
  if (!optionId) return fail("OPTION_ID_REQUIRED", 400);

  const db = createAdminClient();
  const { error } = await db.rpc("cast_poll_vote", {
    p_post: id,
    p_option: optionId,
    p_device: deviceId,
  });

  if (error) return fromDbError(error.message);
  return ok({ post_id: id, option_id: optionId });
}

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
 * 같은 선택지를 다시 누르면 취소된다(DELETE).
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

/**
 * 투표 취소 — 내 표만 지운다.
 *
 * 취소하면 결과도 다시 감춰진다(F-32: 투표해야 결과가 열린다). 표를 뺀 채로
 * 결과를 계속 볼 수 있으면, 들어와서 아무거나 누르고 취소하는 것만으로
 * 결과를 훔쳐볼 수 있다.
 *
 * 이미 표가 없어도 성공으로 돌려준다. 두 번 눌렀을 때 오류가 뜨면 사용자가
 * 뭘 잘못한 것처럼 보이는데, 원하는 상태(표 없음)는 이미 이뤄져 있다.
 */
export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const { id } = await ctx.params;
  const db = createAdminClient();

  const { error } = await db
    .from("poll_votes")
    .delete()
    .eq("post_id", id)
    .eq("device_id", deviceId);

  if (error) return fail("DB_ERROR", 500, error.message);
  return ok({ post_id: id, cleared: true });
}

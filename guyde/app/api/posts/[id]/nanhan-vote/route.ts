import { createAdminClient } from "@/lib/supabase/admin";
import {
  deviceRequired,
  fail,
  fromDbError,
  getDeviceId,
  ok,
} from "@/lib/api/http";

const CHOICES = ["무난해요", "애매해요"] as const;

/**
 * F-36 무난함 판정 — 1기기 1표.
 * 반대편 버튼을 누르면 표가 이동하고(cast_nanhan_vote가 upsert),
 * 같은 버튼을 다시 누르면 취소된다(DELETE).
 * 선택지는 고정 2종뿐이라 작성자가 만들 수 없다(DB CHECK로도 막혀 있음).
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const { id } = await ctx.params;
  let choice: string | undefined;
  try {
    ({ choice } = await req.json());
  } catch {
    return fail("INVALID_JSON", 400);
  }
  if (!choice || !CHOICES.includes(choice as (typeof CHOICES)[number])) {
    return fail("INVALID_CHOICE", 400, "무난해요 또는 애매해요만 가능합니다");
  }

  const db = createAdminClient();
  const { error } = await db.rpc("cast_nanhan_vote", {
    p_post: id,
    p_choice: choice,
    p_device: deviceId,
  });

  if (error) return fromDbError(error.message);
  return ok({ post_id: id, choice });
}

/**
 * 판정 취소 — 내 표만 지운다.
 *
 * 선택지투표와 달리 결과를 감추지 않는다. 무난함 %는 글에 붙은 공개 정보라
 * 투표 여부와 상관없이 피드 배지에도 그대로 나온다 — 여기서만 가린다고
 * 감춰지지 않는다.
 *
 * 이미 표가 없어도 성공으로 돌려준다. 원하는 상태(표 없음)는 이미 이뤄져 있다.
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
    .from("nanhan_votes")
    .delete()
    .eq("post_id", id)
    .eq("device_id", deviceId);

  if (error) return fail("DB_ERROR", 500, error.message);
  return ok({ post_id: id, cleared: true });
}

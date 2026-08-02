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
 * 반대편 버튼을 누르면 표가 이동한다(cast_nanhan_vote가 upsert).
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

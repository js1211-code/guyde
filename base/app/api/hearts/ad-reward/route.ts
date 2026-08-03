import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, getDeviceId, ok } from "@/lib/api/http";
import { grantHearts } from "@/lib/api/grant-hearts";
import {
  AD_REWARD_HEARTS,
  AD_REWARD_LIMIT,
  AD_REWARD_WINDOW_HOURS,
} from "@/lib/constants";

const REASON = "ad_reward";

/**
 * F-80 광고 시청 보상.
 *
 * 광고 SDK는 붙이지 않는다(스코프 밖) — 화면에서 재생을 흉내내고 여기서 지급한다.
 * 대신 상한은 서버가 잡는다. 클라이언트만 믿으면 요청을 반복해 무한 수급이 된다.
 */
async function usedInWindow(
  db: ReturnType<typeof createAdminClient>,
  deviceId: string,
) {
  const since = new Date(
    Date.now() - AD_REWARD_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { count, error } = await db
    .from("heart_transactions")
    .select("*", { count: "exact", head: true })
    .eq("device_id", deviceId)
    .eq("reason", REASON)
    .gte("created_at", since);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** 남은 횟수 조회 — 버튼에 "오늘 3번 더" 를 띄우기 위해 */
export async function GET(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const db = createAdminClient();
  try {
    const used = await usedInWindow(db, deviceId);
    return ok({
      reward: AD_REWARD_HEARTS,
      limit: AD_REWARD_LIMIT,
      remaining: Math.max(0, AD_REWARD_LIMIT - used),
    });
  } catch (e) {
    return fail("DB_ERROR", 500, String(e));
  }
}

export async function POST(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const db = createAdminClient();

  let used: number;
  try {
    used = await usedInWindow(db, deviceId);
  } catch (e) {
    return fail("DB_ERROR", 500, String(e));
  }

  if (used >= AD_REWARD_LIMIT) {
    return fail(
      "AD_LIMIT_REACHED",
      429,
      `${AD_REWARD_WINDOW_HOURS}시간에 ${AD_REWARD_LIMIT}번까지 받을 수 있어요`,
    );
  }

  const result = await grantHearts(db, deviceId, AD_REWARD_HEARTS, REASON);
  if (!result.ok) {
    return fail(result.code, result.code === "USER_NOT_FOUND" ? 404 : 500, result.detail);
  }

  return ok({
    hearts: result.hearts,
    granted: AD_REWARD_HEARTS,
    remaining: Math.max(0, AD_REWARD_LIMIT - used - 1),
  });
}

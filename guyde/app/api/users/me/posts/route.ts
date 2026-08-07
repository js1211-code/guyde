import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, getDeviceId, ok, stripDevice } from "@/lib/api/http";

/**
 * F-74 내 글 목록 — device_id 기준.
 *
 * 피드를 받아서 is_mine으로 거르면 첫 페이지 밖의 내 글이 빠진다.
 * 그래서 서버에서 device_id로 직접 좁힌다.
 */
export async function GET(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  const db = createAdminClient();
  const { data, error } = await db
    .from("posts_feed")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return fail("DB_ERROR", 500, error.message);

  return ok({ items: (data ?? []).map((row) => stripDevice(row, deviceId)) });
}

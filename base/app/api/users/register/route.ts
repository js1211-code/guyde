import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, getDeviceId, ok } from "@/lib/api/http";
import { generateNickname, reroll } from "@/lib/nickname";

/**
 * F-02 유저 등록·조회
 * 헤더의 device_id가 있으면 기존 유저를, 없으면 랜덤 닉네임으로 새로 만든다.
 * 앱 진입 시 한 번 호출하면 되고, 여러 번 불러도 같은 유저를 돌려준다.
 */
export async function POST(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const db = createAdminClient();

  /**
   * 고수인지 여부.
   * 탭바가 매 화면에서 판단해야 하는 값이라 진입 시 한 번에 같이 준다 —
   * 화면마다 따로 물으면 요청이 화면 수만큼 늘어난다.
   * ⚠️ 온도로 판별하지 않는다. 고수는 experts에 행이 있는 사람이다.
   */
  const expertRow = await db
    .from("experts")
    .select("id")
    .eq("device_id", deviceId)
    .maybeSingle();
  const isExpert = Boolean(expertRow.data);

  const existing = await db
    .from("users")
    .select("device_id, nickname, hearts")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (existing.error) return fail("DB_ERROR", 500, existing.error.message);

  if (existing.data) {
    const temp = await db.rpc("calc_temperature", { p_device: deviceId });
    // 온도는 고수 판별 장치라, 계산이 실패했는데 36.5로 떨어뜨리면
    // 모두가 신규처럼 보이는 조용한 오류가 된다. 그래서 그냥 실패시킨다.
    if (temp.error) return fail("TEMPERATURE_FAILED", 500, temp.error.message);
    return ok({ ...existing.data, temperature: Number(temp.data), is_expert: isExpert });
  }

  // 신규 — 닉네임이 unique라 충돌하면 숫자만 다시 뽑아 재시도한다.
  let nickname = generateNickname();
  for (let attempt = 0; attempt < 5; attempt++) {
    const created = await db
      .from("users")
      .insert({ device_id: deviceId, nickname })
      .select("device_id, nickname, hearts")
      .single();

    if (!created.error) {
      return ok({ ...created.data, temperature: 36.5, is_expert: isExpert }, 201);
    }
    // 23505 = unique_violation
    if (created.error.code !== "23505") {
      return fail("DB_ERROR", 500, created.error.message);
    }
    nickname = reroll(nickname);
  }

  return fail("NICKNAME_COLLISION", 500, "닉네임 발급에 실패했습니다");
}

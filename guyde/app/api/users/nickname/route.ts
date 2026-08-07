import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, getDeviceId, ok } from "@/lib/api/http";
import { generateNickname, reroll } from "@/lib/nickname";

const MAX_LEN = 20;

/**
 * F-70 닉네임 변경.
 * device_id는 그대로라 과거 글·댓글·온도가 전부 따라온다.
 * users.nickname이 unique라 중복이면 409로 돌려준다.
 */
export async function PATCH(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  let nickname: string | undefined;
  try {
    ({ nickname } = await req.json());
  } catch {
    return fail("INVALID_JSON", 400);
  }

  const trimmed = nickname?.trim();
  if (!trimmed) return fail("NICKNAME_REQUIRED", 400);
  if (trimmed.length > MAX_LEN) return fail("NICKNAME_TOO_LONG", 400);

  const db = createAdminClient();
  const { data, error } = await db
    .from("users")
    .update({ nickname: trimmed })
    .eq("device_id", deviceId)
    .select("nickname")
    .single();

  if (error?.code === "23505") {
    return fail("NICKNAME_TAKEN", 409, "이미 있는 닉네임이에요");
  }
  if (error) return fail("DB_ERROR", 500, error.message);
  return ok(data);
}

/**
 * 최초 실행 화면의 "닉네임 다시 뽑기".
 * 어떤 이름이 나올지는 서버가 정한다 — 중복 검사를 여기서 해야 하므로.
 */
export async function POST(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const db = createAdminClient();
  let candidate = generateNickname();

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await db
      .from("users")
      .update({ nickname: candidate })
      .eq("device_id", deviceId)
      .select("nickname")
      .single();

    if (!error) return ok(data);
    if (error.code !== "23505") return fail("DB_ERROR", 500, error.message);
    candidate = reroll(candidate);
  }

  return fail("NICKNAME_COLLISION", 500);
}

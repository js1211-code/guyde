import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/api/http";
import { temperaturesOf } from "@/lib/api/consulting";
import { TEMP_EXPERT_GATE } from "@/lib/constants";

/**
 * F-51 고수 목록.
 *
 * 온도는 users.temperature(캐시)를 읽지 않고 calc_temperature()로 계산한다 —
 * 캐시를 읽으면 커뮤니티에서 방금 받은 추천이 반영되지 않아,
 * 프로필의 대표 답변과 목록의 온도가 어긋난다.
 *
 * 42.0도 미만인 고수는 목록에서 뺀다. experts에 행이 남아 있어도
 * 자격을 잃었으면 고수로 보여선 안 된다 — 42도가 기준이라고 화면에 써놓고
 * 41도짜리를 같이 보여주면 그 문구가 거짓이 된다.
 */
export async function GET() {
  const db = createAdminClient();

  const { data: experts, error } = await db
    .from("experts")
    .select("id, device_id, specialty, intro, price");
  if (error) return fail("DB_ERROR", 500, error.message);
  if (!experts?.length) return ok({ items: [] });

  const deviceIds = experts.map((e) => e.device_id);

  const [{ data: users }, temps, { data: reviews }, { data: comments }] =
    await Promise.all([
      db.from("users").select("device_id, nickname").in("device_id", deviceIds),
      temperaturesOf(db, deviceIds),
      db.from("reviews").select("expert_id, rating"),
      db.from("comments").select("device_id").in("device_id", deviceIds),
    ]);

  const nickname = new Map((users ?? []).map((u) => [u.device_id, u.nickname]));

  // 평점 평균과 답변 수는 목록에서 바로 보여야 해서 여기서 집계한다.
  const byExpert = new Map<string, number[]>();
  for (const r of reviews ?? []) {
    byExpert.set(r.expert_id, [...(byExpert.get(r.expert_id) ?? []), r.rating]);
  }
  const answeredCount = new Map<string, number>();
  for (const c of comments ?? []) {
    answeredCount.set(c.device_id, (answeredCount.get(c.device_id) ?? 0) + 1);
  }

  const items = experts
    .map((e) => {
      const ratings = byExpert.get(e.id) ?? [];
      return {
        id: e.id,
        nickname: nickname.get(e.device_id) ?? "알 수 없음",
        temperature: temps.get(e.device_id) ?? 36.5,
        specialty: e.specialty,
        intro: e.intro,
        price: e.price,
        rating: ratings.length
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null,
        review_count: ratings.length,
        answered_count: answeredCount.get(e.device_id) ?? 0,
      };
    })
    .filter((e) => e.temperature >= TEMP_EXPERT_GATE)
    .sort((a, b) => b.temperature - a.temperature);

  return ok({ items });
}

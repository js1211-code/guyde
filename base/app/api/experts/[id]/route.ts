import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/api/http";
import { highlightsOf, temperaturesOf } from "@/lib/api/consulting";

/**
 * F-55 고수 프로필.
 * 핵심은 "커뮤니티 대표 답변 3개"다 — 실제로 단 댓글을 추천순으로 인용하고
 * 원본 글로 잇는다. 소개 문구만 있으면 다른 재능마켓과 구분되지 않는다.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = createAdminClient();

  const { data: expert, error } = await db
    .from("experts")
    .select("id, device_id, specialty, intro, price")
    .eq("id", id)
    .maybeSingle();

  if (error) return fail("DB_ERROR", 500, error.message);
  if (!expert) return fail("EXPERT_NOT_FOUND", 404);

  const [{ data: user }, temps, highlights, { data: reviews }, { count }] =
    await Promise.all([
      db.from("users").select("nickname").eq("device_id", expert.device_id).maybeSingle(),
      temperaturesOf(db, [expert.device_id]),
      highlightsOf(db, expert.device_id),
      db
        .from("reviews")
        .select("rating, body, created_at")
        .eq("expert_id", expert.id)
        .order("created_at", { ascending: false })
        .limit(10),
      db
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("device_id", expert.device_id),
    ]);

  const ratings = (reviews ?? []).map((r) => r.rating);

  return ok({
    id: expert.id,
    nickname: user?.nickname ?? "알 수 없음",
    temperature: temps.get(expert.device_id) ?? 36.5,
    specialty: expert.specialty,
    intro: expert.intro,
    price: expert.price,
    answered_count: count ?? 0,
    rating: ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null,
    highlights,
    reviews: (reviews ?? []).map((r) => ({ rating: r.rating, body: r.body })),
  });
}

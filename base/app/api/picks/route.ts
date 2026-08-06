import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/api/http";
import { NANHAN_PICK_MIN_VOTES, NANHAN_PICK_PERCENT } from "@/lib/constants";

/**
 * 도서관 무난템 서가 — 아이템 카드.
 *
 * 서가에 오르는 조건은 카드가 아니라 **그 카드가 매인 판정글**이 정한다.
 *   ① 판정이 끝났고(is_closed)
 *   ② 표가 NANHAN_PICK_MIN_VOTES 이상 모였고
 *   ③ 무난함이 NANHAN_PICK_PERCENT 이상
 *
 * 카드를 만들었다는 이유로 통과시키지 않는다. 표가 뒤집히면 카드도 저절로
 * 서가에서 빠져야 한다 — 그렇지 않으면 "대중이 판정한다"가 거짓이 된다.
 * 그래서 뷰는 조건을 걸지 않고 값만 내보내고, 거르는 건 여기서 한다.
 *
 * 읽기는 열려 있다. X-Device-Id가 없어도 된다 — 서가는 누가 보든 같다.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  const db = createAdminClient();
  let query = db
    .from("nanhan_picks_view")
    .select(
      "id, post_id, name, price_band, one_liner, why, thumb_url, tags, category, post_title, vouch_count, vote_count, nanhan_percent, is_closed",
    )
    .eq("is_closed", true)
    .gte("vote_count", NANHAN_PICK_MIN_VOTES)
    .gte("nanhan_percent", NANHAN_PICK_PERCENT)
    // 많이 인정받은 것부터. sort_order는 같은 추천수일 때만 갈린다 —
    // 사람이 정한 순서가 대중의 판정을 앞지르면 서가의 뜻이 뒤집힌다.
    .order("vouch_count", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return fail("DB_ERROR", 500, error.message);

  return ok({ items: data ?? [] });
}

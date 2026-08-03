import { createAdminClient } from "@/lib/supabase/admin";
import { fail, getDeviceId, ok, stripDevice } from "@/lib/api/http";

/**
 * S3 글 상세 (F-30·31·32·34·38·41·43)
 *
 * 글 유형에 따라 붙는 위젯이 다르므로 필요한 것만 채워서 내려준다.
 *   정보공유   → likes
 *   선택지투표 → poll
 *   무난함판정 → nanhan
 *   일반질문   → 없음 (댓글만)
 *
 * X-Device-Id는 선택이다. 없으면 "내가 뭘 눌렀는지"만 비워서 읽기 전용으로 준다.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const deviceId = getDeviceId(req);
  const db = createAdminClient();

  const { data: post, error } = await db
    .from("posts_feed")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return fail("DB_ERROR", 500, error.message);
  if (!post) return fail("POST_NOT_FOUND", 404);

  const [images, comments] = await Promise.all([
    db
      .from("post_images")
      .select("id, url, sort_order")
      .eq("post_id", id)
      .order("sort_order"),
    db
      .from("comments_view")
      .select("*")
      .eq("post_id", id)
      // F-43 추천 많은 순 → 최신순
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const commentIds = (comments.data ?? []).map((c) => c.id);
  const myCommentLikes = deviceId && commentIds.length
    ? await db
        .from("comment_likes")
        .select("comment_id")
        .eq("device_id", deviceId)
        .in("comment_id", commentIds)
    : { data: [] };

  const likedComments = new Set(
    (myCommentLikes.data ?? []).map((r) => r.comment_id),
  );

  return ok({
    post: {
      ...stripDevice(post, deviceId),
      images: images.data ?? [],
    },
    poll: post.post_type === "선택지투표" ? await loadPoll(db, id, deviceId) : null,
    nanhan:
      post.post_type === "무난함판정" ? await loadNanhan(db, id, deviceId) : null,
    likes:
      post.post_type === "정보공유" ? await loadLikes(db, id, deviceId) : null,
    // is_mine으로 자기 댓글 추천 버튼을 비활성한다 (F-42).
    // device_id 자체는 내보내지 않는다 — 그게 곧 신원이라서.
    comments: (comments.data ?? []).map((c) => ({
      ...stripDevice(c, deviceId),
      liked_by_me: likedComments.has(c.id),
    })),
  });
}

type Db = ReturnType<typeof createAdminClient>;

/** F-32 선택지별 득표수 + 내 표. 투표 전에는 결과를 감춘다. */
async function loadPoll(db: Db, postId: string, deviceId: string | null) {
  const [options, votes, mine] = await Promise.all([
    db
      .from("poll_options")
      .select("id, text, sort_order")
      .eq("post_id", postId)
      .order("sort_order"),
    db.from("poll_votes").select("option_id").eq("post_id", postId),
    deviceId
      ? db
          .from("poll_votes")
          .select("option_id")
          .eq("post_id", postId)
          .eq("device_id", deviceId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const tally = new Map<string, number>();
  for (const v of votes.data ?? []) {
    tally.set(v.option_id, (tally.get(v.option_id) ?? 0) + 1);
  }
  const total = votes.data?.length ?? 0;
  const myOptionId = mine.data?.option_id ?? null;
  const rows = options.data ?? [];
  const counts = rows.map((o) => tally.get(o.id) ?? 0);
  const percents = toPercents(counts, total);

  return {
    total_votes: total,
    my_option_id: myOptionId,
    // 투표해야 결과가 공개된다 (F-32)
    revealed: myOptionId !== null,
    options: rows.map((o, i) => ({
      ...o,
      vote_count: myOptionId ? counts[i] : null,
      percent: myOptionId && total > 0 ? percents[i] : null,
    })),
  };
}

/**
 * 득표율을 정수로 나누되 합이 정확히 100이 되게 한다(최대잔여법).
 * 선택지마다 따로 반올림하면 62.5→63, 37.5→38 처럼 합이 101%가 되어
 * 화면에서 바로 티가 난다.
 */
function toPercents(counts: number[], total: number): number[] {
  if (total <= 0) return counts.map(() => 0);

  const exact = counts.map((c) => (c / total) * 100);
  const out = exact.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);

  // 소수부가 큰 순서로 남은 1%씩 나눠준다
  const byFraction = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  for (let k = 0; k < byFraction.length && left > 0; k++, left--) {
    out[byFraction[k].i] += 1;
  }
  return out;
}

/** F-34·35 무난해요/애매해요 카운트 + 내 선택 */
async function loadNanhan(db: Db, postId: string, deviceId: string | null) {
  const [votes, mine] = await Promise.all([
    db.from("nanhan_votes").select("choice").eq("post_id", postId),
    deviceId
      ? db
          .from("nanhan_votes")
          .select("choice")
          .eq("post_id", postId)
          .eq("device_id", deviceId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const rows = votes.data ?? [];
  const nanhan = rows.filter((r) => r.choice === "무난해요").length;
  const ambiguous = rows.length - nanhan;

  return {
    무난해요: nanhan,
    애매해요: ambiguous,
    total_votes: rows.length,
    my_choice: mine.data?.choice ?? null,
    // 0표면 배지에서 %를 뺀다 — 뷰가 계산한 값과 같은 값 (F-35)
    percent: rows.length === 0 ? null : Math.round((nanhan / rows.length) * 100),
  };
}

/** F-38 정보 공유 글 좋아요 */
async function loadLikes(db: Db, postId: string, deviceId: string | null) {
  const [count, mine] = await Promise.all([
    db
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId),
    deviceId
      ? db
          .from("post_likes")
          .select("post_id")
          .eq("post_id", postId)
          .eq("device_id", deviceId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    count: count.count ?? 0,
    liked_by_me: Boolean(mine.data),
  };
}

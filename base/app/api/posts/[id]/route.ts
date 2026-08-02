import { createAdminClient } from "@/lib/supabase/admin";
import { fail, getDeviceId, ok } from "@/lib/api/http";

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
      ...post,
      images: images.data ?? [],
    },
    poll: post.post_type === "선택지투표" ? await loadPoll(db, id, deviceId) : null,
    nanhan:
      post.post_type === "무난함판정" ? await loadNanhan(db, id, deviceId) : null,
    likes:
      post.post_type === "정보공유" ? await loadLikes(db, id, deviceId) : null,
    comments: (comments.data ?? []).map((c) => ({
      ...c,
      liked_by_me: likedComments.has(c.id),
      // 자기 댓글은 추천 버튼을 비활성해야 한다 (F-42)
      is_mine: deviceId ? c.device_id === deviceId : false,
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

  return {
    total_votes: total,
    my_option_id: myOptionId,
    // 투표해야 결과가 공개된다 (F-32)
    revealed: myOptionId !== null,
    options: (options.data ?? []).map((o) => ({
      ...o,
      vote_count: myOptionId ? (tally.get(o.id) ?? 0) : null,
      percent:
        myOptionId && total > 0
          ? Math.round(((tally.get(o.id) ?? 0) / total) * 100)
          : null,
    })),
  };
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

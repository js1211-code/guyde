import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, getDeviceId, ok } from "@/lib/api/http";

/**
 * 투표 종료 — 글쓴이만.
 *
 * 종료하면 그 시점의 숫자가 결론이 된다. 결과가 모두에게 공개되고, 표는 더
 * 받지 않는다(DB 트리거가 막는다 — 화면에서 버튼만 감추면 종료 직전에 열어둔
 * 화면에서 여전히 눌린다).
 *
 * 🚨 **되돌릴 수 없다.** 닫았다 다시 열 수 있으면, 닫아서 결과를 본 뒤 다시
 * 여는 것만으로 "투표해야 결과가 보인다"는 규칙이 무력해진다.
 *
 * 표를 받는 글에만 있다. 정보공유·일반질문에는 종료할 투표가 없다.
 *
 * 남의 글은 403이 아니라 404다 — 403이면 "그 글이 있긴 하다"가 새어 나간다.
 */
const VOTABLE = ["선택지투표", "무난함판정"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const { id } = await params;
  const db = createAdminClient();

  const { data: post, error } = await db
    .from("posts")
    .select("id, device_id, post_type, closed_at")
    .eq("id", id)
    .maybeSingle();
  if (error) return fail("DB_ERROR", 500, error.message);
  if (!post || post.device_id !== deviceId) return fail("POST_NOT_FOUND", 404);

  if (!VOTABLE.includes(post.post_type)) {
    return fail("NOT_VOTABLE", 400, "투표가 있는 글만 종료할 수 있어요");
  }
  // 이미 손으로 닫았으면 성공으로 돌려준다. 원하는 상태는 이미 이뤄져 있다.
  // (72시간이 지나 저절로 닫힌 글은 closed_at이 비어 있는데, 그때 도장을
  //  찍어두면 "언제 닫혔나"가 실제와 달라진다 — 아래 update가 그냥 지나간다.)
  if (post.closed_at) return ok({ id, closed_at: post.closed_at });

  const closedAt = new Date().toISOString();
  const { error: updateError } = await db
    .from("posts")
    .update({ closed_at: closedAt })
    .eq("id", id);
  if (updateError) return fail("DB_ERROR", 500, updateError.message);

  return ok({ id, closed_at: closedAt });
}

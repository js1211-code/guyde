import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, fromDbError, getDeviceId, ok } from "@/lib/api/http";

/**
 * 글 신고.
 *
 * 모더레이션 정책이 아직 없어서 신고는 기록만 남긴다 — 자동으로 글이
 * 내려가지는 않는다. 그래도 버튼만 두고 아무 데도 안 보내면 신고했다고
 * 믿은 사람을 속이는 셈이라 저장은 실제로 한다.
 *
 * 자기 글은 신고할 수 없다. 그 자리에는 삭제가 뜬다.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const { id } = await params;

  let body: { reason?: string } = {};
  try {
    body = await req.json();
  } catch {
    // 사유는 선택이라 본문이 없어도 넘어간다.
  }

  const db = createAdminClient();

  const { data: post, error } = await db
    .from("posts")
    .select("id, device_id")
    .eq("id", id)
    .maybeSingle();
  if (error) return fail("DB_ERROR", 500, error.message);
  if (!post) return fail("POST_NOT_FOUND", 404);
  if (post.device_id === deviceId) {
    return fail("SELF_REPORT_NOT_ALLOWED", 400, "내 글은 신고할 수 없어요");
  }

  // 같은 사람이 같은 글을 여러 번 신고해도 한 건으로 본다.
  const { data: already } = await db
    .from("reports")
    .select("id")
    .eq("target_type", "post")
    .eq("target_id", id)
    .eq("device_id", deviceId)
    .maybeSingle();
  if (already) return ok({ reported: true, duplicated: true });

  const { error: insertError } = await db.from("reports").insert({
    target_type: "post",
    target_id: id,
    device_id: deviceId,
    reason: body.reason?.trim() || null,
  });
  if (insertError) return fromDbError(insertError.message);

  return ok({ reported: true }, 201);
}

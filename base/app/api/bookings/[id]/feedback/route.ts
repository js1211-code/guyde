import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, fromDbError, getDeviceId, ok } from "@/lib/api/http";
import { REVISION_MAX, REVISION_REASON_MIN } from "@/lib/constants";

/**
 * 피드백 — [이대로 좋아요] / [수정을 요청해요].
 *
 *   만족     → 상태 '완료'
 *   수정요청 → 상태 '수정 요청됨', revision_count +1. 1회만 가능하다.
 *
 * 수정 요청에 사유를 필수로 받는 이유는 고수를 위해서다. "별로예요"만 오면
 * 2회차도 빗나가는데 그때는 남은 기회가 없다.
 * 최소 글자수는 DB의 feedbacks_reason_required와 같은 값을 쓴다.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const { id } = await params;

  let body: { kind?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_JSON", 400);
  }

  if (body.kind !== "만족" && body.kind !== "수정요청") {
    return fail("INVALID_FEEDBACK_KIND", 400);
  }

  const db = createAdminClient();

  const { data: booking, error: bookingError } = await db
    .from("bookings")
    .select("id, device_id, status, revision_count")
    .eq("id", id)
    .maybeSingle();
  if (bookingError) return fail("DB_ERROR", 500, bookingError.message);
  if (!booking) return fail("BOOKING_NOT_FOUND", 404);

  // 피드백은 신청자만 준다. 고수가 자기 답변을 승인할 수 있으면 안 된다.
  if (booking.device_id !== deviceId) return fail("BOOKING_NOT_FOUND", 404);

  if (booking.status !== "답변 도착") {
    return fail("NOT_ANSWERED_YET", 409, "아직 답변이 도착하지 않았어요");
  }

  const reason = body.reason?.trim() ?? "";
  const revisions = booking.revision_count ?? 0;

  if (body.kind === "수정요청") {
    if (revisions >= REVISION_MAX) {
      return fail("REVISION_LIMIT", 409, "수정 요청은 한 번만 가능해요");
    }
    if (reason.length < REVISION_REASON_MIN) {
      return fail(
        "REASON_TOO_SHORT",
        400,
        `어떤 점이 안 맞았는지 ${REVISION_REASON_MIN}자 이상 적어주세요`,
      );
    }
  }

  // 피드백은 방금 받은 회차에 붙는다.
  const { data: answer } = await db
    .from("consulting_answers")
    .select("id")
    .eq("booking_id", id)
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!answer) return fail("NOT_ANSWERED_YET", 409);

  // 같은 회차에 이미 피드백을 줬으면 막는다. DB에도 unique가 걸려 있지만
  // 거기서 터지면 Postgres 메시지가 그대로 화면에 나온다 —
  // 화면을 두 번 누르는 것만으로도 그 꼴을 볼 수 있어서 여기서 먼저 끊는다.
  const { data: already } = await db
    .from("feedbacks")
    .select("id")
    .eq("booking_id", id)
    .eq("answer_id", answer.id)
    .maybeSingle();
  if (already) {
    return fail("ALREADY_RESPONDED", 409, "이 답변에는 이미 응답했어요");
  }

  const { error } = await db.from("feedbacks").insert({
    booking_id: id,
    answer_id: answer.id,
    kind: body.kind,
    reason: body.kind === "수정요청" ? reason : reason || null,
  });
  if (error) return fromDbError(error.message);

  const patch =
    body.kind === "만족"
      ? { status: "완료", closed_at: new Date().toISOString() }
      : { status: "수정 요청됨", revision_count: revisions + 1 };

  const { error: statusError } = await db.from("bookings").update(patch).eq("id", id);
  if (statusError) return fail("DB_ERROR", 500, statusError.message);

  return ok({ status: patch.status }, 201);
}

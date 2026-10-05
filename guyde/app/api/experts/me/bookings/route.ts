import { createAdminClient } from "@/lib/supabase/admin";
import { deviceRequired, fail, getDeviceId, ok } from "@/lib/api/http";
import { dayLabel, dueLabel } from "@/lib/api/consulting";

/**
 * 고수 콘솔 — 나에게 온 컨설팅 신청 목록.
 *
 * 내 컨설팅(/api/bookings)과 반대편이다. 저쪽은 device_id = 신청자,
 * 여기는 device_id = 담당 고수. 같은 테이블을 다른 쪽에서 본다.
 *
 * 고수가 아니면 빈 목록이 아니라 403이다. 빈 목록으로 돌려주면
 * "신청이 없구나"로 읽혀서 왜 안 보이는지 알 수 없다.
 */
export async function GET(req: Request) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return deviceRequired();

  const db = createAdminClient();

  const { data: expert, error: expertError } = await db
    .from("experts")
    .select("id")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (expertError) return fail("DB_ERROR", 500, expertError.message);
  if (!expert) return fail("NOT_AN_EXPERT", 403, "이 기기는 고수로 등록되어 있지 않아요");

  const { data, error } = await db
    .from("bookings")
    .select("id, status, purpose, budget, concerns, body_note, style_note, created_at, due_at")
    .eq("expert_id", expert.id)
    .order("created_at", { ascending: false });
  if (error) return fail("DB_ERROR", 500, error.message);

  return ok({
    expert_id: expert.id,
    items: (data ?? []).map((b) => ({
      id: b.id,
      status: b.status,
      purpose: b.purpose,
      budget: b.budget,
      concerns: b.concerns ?? [],
      created_label: dayLabel(b.created_at),
      due_label: dueLabel(b.due_at, b.status),
      // 답변을 기다리는 건이 위로 오게 화면이 쓰는 플래그
      needs_answer: b.status === "신청 접수" || b.status === "수정 요청됨",
    })),
  });
}
